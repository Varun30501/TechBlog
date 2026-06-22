package org.blog.repository;



import java.util.List;
import java.util.Optional;

import org.blog.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long>{

	List<Category> findAllByOrderByDisplayOrderAscCategoryNameAsc();

	Optional<Category> findByCategoryNameIgnoreCase(String categoryName);
}
