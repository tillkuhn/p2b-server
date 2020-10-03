package net.timafe.angkor

import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.data.jpa.repository.config.EnableJpaAuditing
import org.springframework.data.jpa.repository.config.EnableJpaRepositories

// @SpringBootApplication(exclude = arrayOf(DataSourceAutoConfiguration::class))
@SpringBootApplication
@EnableJpaRepositories
@EnableJpaAuditing // https://www.baeldung.com/database-auditing-jpa
class Application

fun main(args: Array<String>) {
    SpringApplication.run(Application::class.java, *args)
}
