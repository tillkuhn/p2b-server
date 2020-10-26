package net.timafe.angkor

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import net.timafe.angkor.config.Constants
import net.timafe.angkor.domain.Place
import net.timafe.angkor.domain.dto.POI
import net.timafe.angkor.service.AreaService
import org.assertj.core.api.Assertions.assertThat
import org.hamcrest.CoreMatchers.containsString
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
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

import org.springframework.test.web.servlet.setup.MockMvcBuilders





@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles(Constants.PROFILE_TEST, Constants.PROFILE_CLEAN)
// @ActiveProfiles(Constants.PROFILE_TEST)
@AutoConfigureMockMvc
class IntegrationTests(@Autowired val restTemplate: TestRestTemplate) {

    // https://www.baeldung.com/mockmvc-kotlin-dsl
    // https://github.com/eugenp/tutorials/blob/master/spring-mvc-kotlin/src/test/kotlin/com/baeldung/kotlin/mockmvc/MockMvcControllerTest.kt

    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var objectMapper: ObjectMapper
    @Autowired lateinit var areaService: AreaService


    @Test
    fun testAreaTree() {
        assertThat(areaService.getAreaTree().size).isGreaterThan(5)
    }


    @Test
    @Throws(Exception::class)
    @WithMockUser(username = "hase", roles = ["USER"])
    fun testFileUpload() {
        val firstFile = MockMultipartFile("file", "recipe.txt", "text/plain", "leckernudeln".toByteArray())
        mockMvc.perform(MockMvcRequestBuilders.multipart("${Constants.API_DEFAULT_VERSION}/${Constants.API_PATH_PLACES}/123/upload")
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

        val mvcResult = mockMvc.post(Constants.API_DEFAULT_VERSION + "/places") {
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(Place(name = "hase", id = null, areaCode = "de",
                    imageUrl = "http://", primaryUrl = "http://", summary = "nice place", notes = "come back again"))
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
        mockMvc.get(Constants.API_DEFAULT_VERSION + "/dishes") {
        }.andExpect {
            status { isOk }
            jsonPath("$") {isArray}
        }.andDo{print()}
    }

    @Test
    @Throws(Exception::class)
    fun testGetPois() {
        val mvcResult = mockMvc.get(Constants.API_DEFAULT_VERSION + "/pois") {
        }.andExpect {
            status { isOk }
            jsonPath("$") {isArray}
        }.andDo{ /* print() */}.andReturn()
        val actual: List<POI?>? = objectMapper.readValue(mvcResult.response.contentAsString, object : TypeReference<List<POI?>?>() {})
        assertThat(actual?.size).isGreaterThan(0)
    }

    @Test
    @Throws(Exception::class)
    fun `Assert we get notes`() {
        mockMvc.get(Constants.API_DEFAULT_VERSION + "/notes") {
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
    fun `Assert we have geocodes`() {
        val entity = restTemplate.getForEntity<String>(Constants.API_DEFAULT_VERSION + "/geocodes", String::class.java)
        assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(entity.body).contains("Thailand")
    }

}
