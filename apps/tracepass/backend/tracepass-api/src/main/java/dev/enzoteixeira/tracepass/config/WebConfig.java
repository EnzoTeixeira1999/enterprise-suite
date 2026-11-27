package dev.enzoteixeira.tracepass.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String[] allowedOriginPatterns;
    private final byte[] adminAuthorization;

    public WebConfig(
            @Value(
                    "${tracepass.cors.allowed-origin-patterns:http://localhost:5173}"
            )
            String allowedOriginPatterns,
            @Value("${tracepass.admin.token:}") String adminToken
    ) {
        this.allowedOriginPatterns = Arrays
                .stream(allowedOriginPatterns.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toArray(String[]::new);
        this.adminAuthorization = adminToken.isBlank() ? new byte[0]
                : ("Bearer " + adminToken).getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(
                    HttpServletRequest request, HttpServletResponse response, Object handler
            ) {
                if (CorsUtils.isPreFlightRequest(request)) {
                    return true;
                }

                response.setHeader("Cache-Control", "no-store");
                String authorization = request.getHeader("Authorization");
                if (adminAuthorization.length > 0 && authorization != null
                        && MessageDigest.isEqual(adminAuthorization, authorization.getBytes(StandardCharsets.UTF_8))) {
                    return true;
                }

                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return false;
            }
        }).addPathPatterns("/api/**").excludePathPatterns("/api/public/passports/{batchId}");
    }

    @Override
    public void addCorsMappings(
            CorsRegistry registry
    ) {
        registry
                .addMapping("/**")
                .allowedOriginPatterns(
                        allowedOriginPatterns
                )
                .allowedMethods(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
                .allowedHeaders("*")
                .exposedHeaders("Location")
                .allowCredentials(false)
                .maxAge(3600);
    }
}