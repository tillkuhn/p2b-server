package net.timafe.angkor

import net.timafe.angkor.domain.Place
import net.timafe.angkor.domain.dto.UserSummary
import net.timafe.angkor.domain.enums.AuthScope
import net.timafe.angkor.service.TaggingService
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.util.*
import kotlin.test.assertEquals

class UnitTests {

    val taggingService = TaggingService();

    @Test
    fun testEnum() {
        assertEquals(AuthScope.ALL_AUTH.name,"ALL_AUTH")
    }

    @Test
    fun testTags() {
        val code = "Sri Lanka North"
        assertThat(taggingService.normalizeTag(code)).isEqualTo("sri-lanka-north")
    }

    @Test
    fun testUserSummary() {
        var user = UserSummary(id = UUID.randomUUID(), name = "Hase Klaus")
        assertThat(user.shortname).isEqualTo("Hase K.")
        user = UserSummary(id = UUID.randomUUID(), name = "Horst")
        assertThat(user.shortname).isEqualTo("Horst")
        // println(ObjectMapper().writeValueAsString(user))
    }


}
