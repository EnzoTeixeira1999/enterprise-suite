package dev.enzoteixeira.tracepass.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI tracePassOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("TracePass API")
                        .version("1.0.0")
                        .description(
                                "API da plataforma TracePass para rastreabilidade "
                                        + "operacional, acompanhamento logístico "
                                        + "e gestão integrada de empresas e filiais."
                        )
                        .contact(new Contact()
                                .name("Enzo Teixeira Alves")
                        )
                );
    }
}