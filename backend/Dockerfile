# Stage 1: Build the application using Java 21 and Maven
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copy Maven configuration
COPY pom.xml .

# Download dependencies
RUN mvn -B dependency:go-offline

# Copy application source code
COPY src ./src

# Build the Spring Boot application
RUN mvn -B clean package -DskipTests


# Stage 2: Run the application using Java 21
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy the generated JAR
COPY --from=build /app/target/*.jar app.jar

# Default port
EXPOSE 8080

# Start Spring Boot using Render's PORT environment variable
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]