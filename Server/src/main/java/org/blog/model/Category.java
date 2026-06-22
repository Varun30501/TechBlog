package org.blog.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.validation.constraints.NotBlank;

import lombok.Data;

@Entity
@Data
public class Category {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long categoryId;
	
	@Column(nullable = false, length = 40, unique = true)
	@NotBlank(message = "Category name is required.")
	private String categoryName;

	@Column(length = 180)
	private String categoryDescription;

	@Column(nullable = false)
	private int displayOrder;

	@PrePersist
	private void syncDefaults() {
		if (displayOrder <= 0) {
			displayOrder = 100;
		}
	}

}
