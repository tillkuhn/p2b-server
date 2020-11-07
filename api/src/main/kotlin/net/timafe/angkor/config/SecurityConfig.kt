package net.timafe.angkor.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter
import org.springframework.security.core.session.SessionRegistry
import org.springframework.security.core.session.SessionRegistryImpl

@Configuration
@EnableWebSecurity
// @EnableGlobalMethodSecurity(prePostEnabled = true, securedEnabled = true)
class SecurityConfig : WebSecurityConfigurerAdapter() {

    @Throws(Exception::class)
    public override fun configure(http: HttpSecurity) {

        // Adds a {@link CorsFilter} to be used. If a bean by the name of corsFilter is
        http.cors()

        http.csrf().disable()

        // Controls the maximum number of sessions for a user. The default is to allow any
        // https://www.baeldung.com/spring-security-track-logged-in-users#alternative-method-using-sessionregistry
        http.sessionManagement().maximumSessions(1).sessionRegistry(sessionRegistry())

        http.authorizeRequests()

                // Free information for everbody
                .antMatchers("/api/auth-info").permitAll()
                .antMatchers("/api/public/**").permitAll()
                .antMatchers("/actuator/health").permitAll()

                // requires authenication
                .antMatchers("/authorize").authenticated()
                .antMatchers("/api/secure/**").authenticated()

                // requires specific roles, ROLE_ prefix is added automatically
                .antMatchers("${Constants.API_DEFAULT_VERSION}/admin/**").hasRole("ADMIN")
                // * spread operator converts array into ...varargs
                .antMatchers(HttpMethod.DELETE, *getEntityPatterns()).hasRole("ADMIN")

                .antMatchers(HttpMethod.POST, *getEntityPatterns()).hasRole("USER")
                .antMatchers(HttpMethod.PUT, *getEntityPatterns()).hasRole("USER")
                .and()

                // Configures authentication support using an OAuth 2.0 and/or OpenID Connect 1.0 Provider.
                // and Configures OAuth 2.0 Client support.
                .oauth2Login()
                .and()
                .oauth2Client()
    }

    @Bean
    fun sessionRegistry(): SessionRegistry? {
        return SessionRegistryImpl()
    }

    fun getEntityPatterns(): Array<String> {
        return arrayOf("${Constants.API_DEFAULT_VERSION}/places/**",
                "${Constants.API_DEFAULT_VERSION}/notes/**",
                "${Constants.API_DEFAULT_VERSION}/dishes/**",
                "${Constants.API_DEFAULT_VERSION}/areas/**")
    }

}
