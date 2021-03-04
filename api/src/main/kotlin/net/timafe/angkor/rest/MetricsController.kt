package net.timafe.angkor.rest

import com.fasterxml.jackson.databind.ObjectMapper
import net.timafe.angkor.config.AppProperties
import net.timafe.angkor.config.Constants
import net.timafe.angkor.domain.dto.MetricDTO
import net.timafe.angkor.service.StatService
import org.slf4j.LoggerFactory
import org.springframework.boot.actuate.metrics.MetricsEndpoint
import org.springframework.core.SpringVersion
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

/**
 * https://stackoverflow.com/questions/32382349/how-to-get-metrics-from-spring-boot-actuator-programmatically
 */
@RestController
class MetricsController(
    private val metricsEndpoint: MetricsEndpoint,
    private val appProperties: AppProperties,
    private val objectMapper: ObjectMapper,
    private val stats: StatService
) {

    private val log = LoggerFactory.getLogger(javaClass)

    companion object {
        val filterNames = setOf(
            "hikaricp.connections.max",
            "hikaricp.connections.active",
            "hikaricp.connections.acquire",
            "hikaricp.connections",
            "jvm.memory.max",
            "jvm.memory.committed",
            "jvm.memory.used",
            "process.start.time",
            "process.uptime",
            "system.cpu.usage",
            "tomcat.sessions.active.current",
            "tomcat.sessions.active.max",
            "tomcat.sessions.created"
        )
    }

    @GetMapping("${Constants.API_LATEST}/stats")
    fun entityStats(): Map<String,Long>  {
        return stats.entityStats()
    }
    // @PreAuthorize(Constants.ADMIN_AUTHORITY)
    @GetMapping("${Constants.API_LATEST}/admin/metrics")
    @ResponseStatus(HttpStatus.OK)
    fun metrics(): List<MetricDTO> {
        val meli = mutableListOf<MetricDTO>()
        meli.add(MetricDTO("spring.version", "Spring Framework Version", SpringVersion.getVersion(), null))
        meli.add(MetricDTO("java.version", "Java Major Minor Version", System.getProperty("java.version"), null))
        meli.add(MetricDTO("kotlin.version", "Kotlin Version", KotlinVersion.CURRENT.toString(), null))
        meli.add(MetricDTO("app.version", "App Version (API)", appProperties.version, null))
        meli.addAll(metricsEndpoint.listNames().names
            .filter { filterNames.contains(it) }
            .map {
                val resp: MetricsEndpoint.MetricResponse = metricsEndpoint.metric(it, null)
                MetricDTO(resp.name, resp.description, resp.measurements.get(0).value, resp.baseUnit)
            }
        )
        return meli
    }

    @GetMapping("${Constants.API_LATEST}/metrics")
    @ResponseStatus(HttpStatus.OK)
    fun publicMetrics(): List<MetricDTO> {
        return this.metrics()
    }

}
