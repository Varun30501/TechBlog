package org.blog.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfiguration {

	@Bean
	public OpenAPI blogOpenApi() {
		return new OpenAPI()
				.info(new Info()
						.title("TechBlog API")
						.description("Modern REST API for posts, categories, users, comments, search, and feeds.")
						.version("2.0"));
	}
}
