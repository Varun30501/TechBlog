# ── Stage 1: build the jar with Maven (via the wrapper, no local mvn needed) ──
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app

# Copy only the wrapper + pom first so dependency resolution is cached
# across builds when only source files change.
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x mvnw
RUN ./mvnw -q dependency:go-offline

COPY src ./src
RUN ./mvnw -q clean package -DskipTests

# ── Stage 2: slim runtime image with just the JRE + built jar ──
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Render sets $PORT at runtime; Spring Boot reads server.port from it.
# -Djava.net.preferIPv4Stack=true avoids a known class of "connection refused"
# failures when a host (like Aiven's MySQL endpoint) resolves to both an IPv4
# and IPv6 address and the IPv6 path isn't actually reachable from inside the
# container network — forcing IPv4 sidesteps that entirely.
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -Djava.net.preferIPv4Stack=true -jar app.jar --server.port=${PORT:-8080}"]