package com.tirashop.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/avatar/**")
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/uploads/avatar/");

        registry.addResourceHandler("/uploads/logo/**")
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/uploads/logo/");

        registry.addResourceHandler("/uploads/product/image/**")
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/uploads/product/image/");

        registry.addResourceHandler("/uploads/review/**")
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/uploads/review/");

        registry.addResourceHandler("/uploads/post/**")
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/uploads/post/");
    }
}
