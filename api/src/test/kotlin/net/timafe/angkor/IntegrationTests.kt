package net.timafe.angkor

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import net.timafe.angkor.config.Constants
import net.timafe.angkor.domain.Place
import net.timafe.angkor.domain.enums.AuthScope
import net.timafe.angkor.repo.DishRepository
import net.timafe.angkor.repo.EventRepository
import net.timafe.angkor.repo.NoteRepository
import net.timafe.angkor.repo.PlaceRepository
import net.timafe.angkor.rest.TagController
import net.timafe.angkor.security.SecurityUtils
import net.timafe.angkor.service.AreaService
import org.assertj.core.api.Assertions.assertThat
import org.hamcrest.CoreMatchers.containsString
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.data.domain.Pageable
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.result.MockMvcResultMatchers
import java.util.*

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles(Constants.PROFILE_TEST, Constants.PROFILE_CLEAN) // Profile Clean ensures that we start with fresh db
@AutoConfigureMockMvc
class IntegrationTests(@Autowired val restTemplate: TestRestTemplate) {

    // https://www.baeldung.com/mockmvc-kotlin-dsl
    // https://github.com/eugenp/tutorials/blob/master/spring-mvc-kotlin/src/test/kotlin/com/baeldung/kotlin/mockmvc/MockMvcControllerTest.kt

    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var objectMapper: ObjectMapper

    // svc + controller  beans to test
    @Autowired lateinit var areaService: AreaService
    @Autowired lateinit var tagController: TagController

    // repo beans to test
    @Autowired lateinit var dishRepository: DishRepository
    @Autowired lateinit var noteRepository: NoteRepository
    @Autowired lateinit var placeRepository: PlaceRepository
    @Autowired lateinit var eventRepository: EventRepository

    val someUser: UUID = UUID.fromString("00000000-0000-0000-0000-000000000002")

    @Test
    fun testAreaTree() {
        assertThat(areaService.getAreaTree().size).isGreaterThan(5)
    }

    @Test
    fun testAllTags() {
        assertThat(tagController.alltags().size).isGreaterThan(2)
    }

    @Test
    fun testAllDishes() {
        assertThat(dishRepository.findAll().size).isGreaterThan(1)
    }

    @Test
    fun testEventsAccessible() {
        // todo test real data, for now test at least if query works
        assertThat(eventRepository.findAll().size).isGreaterThan(-1)
    }

    @Test
    fun testNativeSQL() {
        val scopes = SecurityUtils.authScopesAsString(listOf(AuthScope.PUBLIC))
        assertThat(dishRepository.search(Pageable.unpaged(),"",scopes).size).isGreaterThan(0)
        assertThat(noteRepository.search(Pageable.unpaged(),"",scopes).size).isGreaterThan(0)
        assertThat(placeRepository.search(Pageable.unpaged(),"",scopes).size).isGreaterThan(0)
    }

    @Test
    @Throws(Exception::class)
    @WithMockUser(username = "hase", roles = ["USER"])
    fun testFileUpload() {
        val firstFile = MockMultipartFile("file", "recipe.txt", "text/plain", "pasta".toByteArray())
        mockMvc.perform(MockMvcRequestBuilders.multipart("${Constants.API_LATEST}/${Constants.API_PATH_PLACES}/815/${Constants.API_PATH_FILES}")
                .file(firstFile)
                .param("some-random", "4"))
                .andExpect(MockMvcResultMatchers.status().`is`(200))
                .andExpect(MockMvcResultMatchers.content().string(containsString("Successfully")))
    }

    @Test
    @Throws(Exception::class)
    // We can also easily customize the roles. For example, this test will be invoked with the username "hase" and the roles "ROLE_USER"
    @WithMockUser(username = "hase", roles = ["USER"])
    fun testPlacePost() {

        val mvcResult = mockMvc.post(Constants.API_LATEST + "/places") {
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(Place(name = "hase", id = null, areaCode = "de", lastVisited= null,
                    imageUrl = "http://", primaryUrl = "http://", summary = "nice place", notes = "come back again",createdBy = someUser,updatedBy = someUser))
            accept = MediaType.APPLICATION_JSON
        }.andExpect {
            status { /*isOk*/ isCreated }
            content { contentType(MediaType.APPLICATION_JSON) }
            content { string(containsString("hase")) }
            jsonPath("$.name") { value("hase") }
            jsonPath("$.summary") { value("nice place") }
            /*content { json("{}") }*/
        }.andDo {
            /* print ())*/
        }.andReturn()

        val newPlace = objectMapper.readValue(mvcResult.response.contentAsString, Place::class.java)
        assertThat(newPlace.id).isNotNull()
        // objectMapper.writeValue(System.out,newPlace)
    }

    @Test
    @Throws(Exception::class)
    fun testGetDishes() {
        mockMvc.get(Constants.API_LATEST + "/dishes/search/") {
        }.andExpect {
            status { isOk }
            jsonPath("$") {isArray}
        }.andDo{print()}
    }

    @Test
    @Throws(Exception::class)
    @WithMockUser(username = "hase", roles = ["USER"])
    fun testUserSummaries() {
        mockMvc.get(Constants.API_LATEST + "/user-summaries") {
        }.andExpect {
            status { isOk }
            jsonPath("$") {isArray}
            // son path value method can take org.hamcrest.Matcher as parameter.
            // So you can use GreaterThan class: jsonPath("['key']").value(new GreaterThan(1))
           jsonPath("$.length()") {value(org.hamcrest.Matchers.greaterThan(0) )} // resturns only hase
            // org.hamcrest.Matchers.greaterThan(T value)
            //  jsonPath("$.length()") {org.hamcrest.Matchers.greaterThan(2) }
        }.andDo{print()}
    }

    @Test
    @Throws(Exception::class)
    // https://www.baeldung.com/mockmvc-kotlin-dsl
    fun testGetPois() {
        objectMapper.registerKotlinModule()
        /*val mvcResult = */ mockMvc.get(Constants.API_LATEST + "/pois") {
        }.andExpect {
            status { isOk }
            content { contentType(MediaType.APPLICATION_JSON) }
            jsonPath("$") {isArray}
            jsonPath("$.length()") {value(6)}
            // .andExpect(jsonPath("$.description", is("Lorem ipsum")))
        }.andDo{ /* print() */ }.andReturn()
        // val actual: List<POI?>? = objectMapper.readValue(mvcResult.response.contentAsString, object : TypeReference<List<POI?>?>() {})
        // assertThat(actual?.size).isGreaterThan(0)
    }

    @Test
    @Throws(Exception::class)
    fun `Assert we get notes`() {
        mockMvc.get(Constants.API_LATEST + "/notes/search/") {
        }.andExpect {
            status { isOk }
            jsonPath("$") {isArray}
        }
    }

    @Test
    fun `Assert greeting content and status code`() {
        val entity = restTemplate.getForEntity<String>("/greeting", String::class.java)
        assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(entity.body).contains("World")
    }

    @Test
    fun `Assert we have areas`() {
        val entity = restTemplate.getForEntity<String>(Constants.API_LATEST + "/areas", String::class.java)
        assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(entity.body).contains("Thailand")
    }

}
