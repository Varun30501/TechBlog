package org.blog.config;

import java.util.List;
import java.util.Objects;

import org.blog.model.Category;
import org.blog.model.Post;
import org.blog.model.User;
import org.blog.repository.CategoryRepository;
import org.blog.repository.PostRepository;
import org.blog.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

	@Bean
	CommandLineRunner seedData(
			CategoryRepository categoryRepo,
			UserRepository userRepo,
			PostRepository postRepo,
			PasswordEncoder passwordEncoder) {
		return args -> {
			if (categoryRepo.count() == 0) {
				categoryRepo.saveAll(Objects.requireNonNull(List.of(
						makeCategory("Java", "Spring, JVM, backend engineering, and architecture.", 1),
						makeCategory("Python", "Python tooling, automation, data, and backend work.", 2),
						makeCategory("JavaScript", "Frontend and Node.js development, frameworks, and tooling.", 3),
						makeCategory("Data Science", "Analytics, notebooks, data platforms, and visualization.", 4),
						makeCategory("AI", "Applied AI, product workflows, and practical model usage.", 5),
						makeCategory("Machine Learning", "ML systems, model training, evaluation, and MLOps.", 6),
						makeCategory("DevOps", "CI/CD, containers, infrastructure, and deployment pipelines.", 7),
						makeCategory("Cloud Computing", "AWS, Azure, GCP, and cloud-native architecture.", 8),
						makeCategory("Cybersecurity", "Application security, threat modeling, and best practices.", 9),
						makeCategory("Databases", "SQL, NoSQL, schema design, and performance tuning.", 10),
						makeCategory("Mobile Development", "iOS, Android, and cross-platform app development.", 11),
						makeCategory("Web Development", "Full-stack web concepts, frameworks, and best practices.", 12),
						makeCategory("Career Advice", "Interview prep, growth tips, and developer career guidance.", 13),
						makeCategory("Productivity", "Tools, workflows, and habits for working smarter.", 14),
						makeCategory("Open Source", "Contributing to and maintaining open-source projects.", 15),
						makeCategory("Tech News", "Industry updates, product launches, and trends.", 16)
				)));
			}

			if (postRepo.count() > 0) {
				return;
			}

			User author = userRepo.findByUserEmailIgnoreCase("demo@techblog.local")
					.orElseGet(() -> {
						User user = new User();
						user.setUserName("Demo Author");
						user.setUserEmail("demo@techblog.local");
						user.setUserPassword(passwordEncoder.encode("password123"));
						user.setAbout("Sample account for exploring TechBlog.");
						user.setRole("USER");
						return userRepo.save(user);
					});

			Category java = categoryRepo.findByCategoryNameIgnoreCase("Java").orElseThrow();
			Category ai = categoryRepo.findByCategoryNameIgnoreCase("AI").orElseThrow();
			Category python = categoryRepo.findByCategoryNameIgnoreCase("Python").orElseThrow();

			postRepo.saveAll(List.of(
					makePost(
							"Getting Started with Spring Boot 3",
							"Spring Boot 3 simplifies REST APIs, validation, and JPA integration. This walkthrough covers project setup, controller design, and local development with an in-memory database profile.",
							java,
							author,
							true,
							42),
					makePost(
							"Building a Modern Angular Frontend",
							"Angular standalone bootstrap, provideHttpClient, and a dev-server proxy keep the UI fast while talking to a Spring Boot backend without CORS headaches.",
							java,
							author,
							true,
							28),
					makePost(
							"Practical AI Workflows for Developers",
							"Use AI to accelerate code review, documentation, and prototyping while keeping humans in the loop for architecture and security decisions.",
							ai,
							author,
							false,
							15),
					makePost(
							"Python Scripts That Save Hours Each Week",
							"Automate repetitive tasks with small Python utilities: data cleanup, CSV transforms, and scheduled reports that fit into any engineering workflow.",
							python,
							author,
							false,
							9)
			));
		};
	}

	private static Category makeCategory(String name, String description, int order) {
		Category c = new Category();
		c.setCategoryName(name);
		c.setCategoryDescription(description);
		c.setDisplayOrder(order);
		return c;
	}

	private static Post makePost(
			String title,
			String content,
			Category category,
			User author,
			boolean featured,
			long views) {
		Post post = new Post();
		post.setPostTitle(title);
		post.setPostContent(content);
		post.setCategory(category);
		post.setUser(author);
		post.setFeatured(featured);
		post.setViewCount(views);
		post.setPostImage(new byte[0]);
		return post;
	}
}