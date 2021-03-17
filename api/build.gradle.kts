import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

buildscript {
    val kotlinVersion: String by System.getProperties()
    val postgresVersion: String by System.getProperties()
    dependencies {
        classpath("org.postgresql:postgresql:$postgresVersion")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
    }
}

group = "com.github.tillkuhn"
version = "0.0.1-SNAPSHOT"
java.sourceCompatibility = JavaVersion.VERSION_11

plugins {
    val kotlinVersion: String by System.getProperties()
    val flywayVersion: String by System.getProperties()
    val springBootVersion: String by System.getProperties()
    id("org.springframework.boot") version springBootVersion
    id("io.spring.dependency-management") version "1.0.11.RELEASE"
    id("org.flywaydb.flyway") version flywayVersion
    id("com.github.ben-manes.versions") version "0.36.0"
    kotlin("jvm") version kotlinVersion
    kotlin("plugin.spring") version kotlinVersion
    kotlin("plugin.jpa") version kotlinVersion
    kotlin("plugin.noarg") version kotlinVersion
    kotlin("plugin.allopen") version kotlinVersion
    // SonarQube
    id("org.sonarqube") version "3.1.1"
   // maven
    jacoco
    java
}

repositories {
    mavenCentral()
    maven {
        name = "jitpack.io"
        url = uri("https://jitpack.io")
    }
}

dependencies {
    // Spring, SpringBoot and starter kits
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
    implementation("org.springframework.boot:spring-boot-starter-json")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation ("com.rometools:rome:1.15.0")

    // Sometimes ... caching makes sense: https://codeboje.de/caching-spring-boot/
    implementation("org.springframework.boot:spring-boot-starter-cache")

    // since 2.3.1 we need to add validation starter ourselves
    // https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.3-Release-Notes#validation-starter-no-longer-included-in-web-starters
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // Kotlin - Use the Kotlin JDK 8 standard library.
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation(kotlin("stdlib-jdk8"))
    implementation(kotlin("reflect"))
    testImplementation(kotlin("test"))
    testImplementation(kotlin("test-junit5"))

    // Commons
    implementation("org.apache.commons:commons-lang3:3.11")

    // Persistence
    val postgresVersion: String by System.getProperties()
    val flywayVersion: String by System.getProperties()
    implementation("org.postgresql:postgresql:$postgresVersion")
    implementation("org.flywaydb:flyway-core:$flywayVersion") // looks for  classpath:db/migration
    implementation("com.vladmihalcea:hibernate-types-52:2.10.3") // https://vladmihalcea.com/how-to-map-java-and-sql-arrays-with-jpa-and-hibernate/

    // Jackson JSON Parsing
    // https://stackoverflow.com/questions/25184556/how-to-make-sure-spring-boot-extra-jackson-modules-are-of-same-version
    // For Gradle users, if you use the Spring Boot Gradle plugin you can omit the version number to adopt
    // the dependencies managed by Spring Boot, such as those Jackson modules

    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("com.fasterxml.jackson.module:jackson-module-afterburner")
    implementation("com.fasterxml.jackson.core:jackson-databind")
    implementation("com.fasterxml.jackson.dataformat:jackson-dataformat-yaml")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")

    // Test Dependencies
    testImplementation("org.springframework.boot:spring-boot-starter-test") {
        exclude(group = "org.junit.vintage", module = "junit-vintage-engine")
    }
    testImplementation("org.springframework.security:spring-security-test")
    // https://stackoverflow.com/a/14292888/4292075 required to mock final classes
    testImplementation("org.mockito:mockito-inline:3.8.0")
}

tasks.test {
    useJUnitPlatform()
    finalizedBy("jacocoTestReport")
    doLast {
        println("Code coverage report can be found at: file://$buildDir/reports/jacoco/test/html/index.html")
    }
}

tasks.withType<KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs = listOf("-Xjsr305=strict")
        jvmTarget = "11"
    }
}

tasks.bootJar {
    archiveVersion.set("")
    // https://stackoverflow.com/questions/53123012/spring-boot-2-change-jar-name
    archiveFileName.set("app.jar")
}

jacoco {
    toolVersion = "0.8.5"
}

// https://kevcodez.de/posts/2018-08-19-test-coverage-in-kotlin-with-jacoco/
// :-( Caused by: java.lang.IllegalStateException:
//Can't add different class with same name: net/timafe/angkor/ApplicationKt

tasks.jacocoTestReport {
    reports {
        xml.setEnabled(true)
    }
}


tasks.bootRun.configure {
    systemProperty("spring.profiles.active", "default")
}

// Custom tasks for different spring profiles...
tasks.register("bootRunClean") {
    group = "application"
    description = "Runs this project as a Spring Boot application with the clean db profile"
    doFirst {
        tasks.bootRun.configure {
            systemProperty("spring.profiles.active", "clean")
        }
    }
    finalizedBy("bootRun")
}

tasks.register("bootRunProd") {
    group = "application"
    description = "Runs this project as a Spring Boot application with the prod profile"
    doFirst {
        tasks.bootRun.configure {
            systemProperty("spring.profiles.active", "prod")
        }
    }
    finalizedBy("bootRun")
}

sonarqube {
    properties {
        property("sonar.projectKey", "angkor-api")
        property("sonar.projectName", "Angkor API")
        property("sonar.projectDescription", "API for Angular Kotlin Rest App")
        property("sonar.coverage.jacoco.xmlReportPaths","build/reports/jacoco/test/jacocoTestReport.xml")
        // domain objects are mostly data classes which don't support inheritance really well, so we exlude
        // them from duplication detection (cf. https://docs.sonarqube.org/7.4/analysis/analysis-parameters/)
        property("sonar.cpd.exclusions","src/main/kotlin/net/timafe/angkor/domain/**/*")
    }
}
