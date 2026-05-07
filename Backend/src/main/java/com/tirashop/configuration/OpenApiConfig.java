package com.tirashop.configuration;

import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.parameters.RequestBody;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    //http://localhost:8080/swagger-ui/index.html
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("TiraShop API Documentation")
                        .version("1.0")
                        .description("Documentation for TiraShop APIs"))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new io.swagger.v3.oas.models.Components()
                        .addSecuritySchemes("Bearer Authentication",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT"))
                        .addRequestBodies("tryOnRequest",
                                new RequestBody()
                                        .content(new Content().addMediaType("multipart/form-data",
                                                new MediaType().schema(new Schema<>()
                                                        .type("object")
                                                        .addProperties("modelImage", new Schema<>().type("string").format("binary"))
                                                        .addProperties("dressImage", new Schema<>().type("string").format("binary"))
                                                )))));
    }
}
