package com.tirashop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;


@SpringBootApplication
@EnableFeignClients
public class TiraShopApplication {
	public static void main(String[] args) {
		SpringApplication.run(TiraShopApplication.class, args);
	}
}
 