package org.blog.controller;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.blog.model.Category;
import org.blog.repository.CategoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/blog")
public class CategoryController {

	private final CategoryRepository repository;

	public CategoryController(CategoryRepository repository) {
		this.repository = repository;
	}

	@PostMapping("/category")
	public ResponseEntity<Map<String, String>> addCategory(@Valid @RequestBody Category category) {
		try {
			category.setCategoryId(null);
			this.repository.save(category);
			return ResponseEntity.status(HttpStatus.CREATED).body(success("Category added."));
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(failed("Problem in adding category."));
		}
	}

	@GetMapping("/categories")
	public ResponseEntity<List<Category>> getAllCategories() {
		return ResponseEntity.ok(this.repository.findAllByOrderByDisplayOrderAscCategoryNameAsc());
	}

	@GetMapping("/category/{categoryId}")
	public ResponseEntity<?> getCategory(@PathVariable("categoryId") Long categoryId) {
		// Objects.requireNonNull tells the null-safety analyser the value is @NonNull,
		// clearing the "needs unchecked conversion to @NonNull Long" warning on findById().
		return this.repository.findById(Objects.requireNonNull(categoryId))
				.<ResponseEntity<?>>map(cat -> ResponseEntity.ok(cat))
				.orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(failed("Category id not found.")));
	}

	@PutMapping("/category")
	public ResponseEntity<Map<String, String>> updateCategory(@Valid @RequestBody Category category) {
		if (category.getCategoryId() == null) {
			return ResponseEntity.badRequest().body(failed("Category id is required for update."));
		}
		return this.repository.findById(Objects.requireNonNull(category.getCategoryId()))
				.map(existingObj -> {
					existingObj.setCategoryName(category.getCategoryName());
					existingObj.setCategoryDescription(category.getCategoryDescription());
					existingObj.setDisplayOrder(category.getDisplayOrder());
					this.repository.save(existingObj);
					return ResponseEntity.ok(success("Category updated."));
				})
				.orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(failed("Category id not found.")));
	}

	@DeleteMapping("/category/{categoryId}")
	public ResponseEntity<Map<String, String>> deleteCategory(@PathVariable("categoryId") Long categoryId) {
		if (this.repository.findById(Objects.requireNonNull(categoryId)).isPresent()) {
			this.repository.deleteById(categoryId);
			return ResponseEntity.ok(success("Category deleted."));
		}
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(failed("Category id not found."));
	}

	private Map<String, String> success(String message) {
		return Map.of("status", "success", "message", message);
	}

	private Map<String, String> failed(String message) {
		return Map.of("status", "failed", "message", message);
	}
}