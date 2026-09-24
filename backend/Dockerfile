FROM maven:3.9-eclipse-temurin-24 AS build

WORKDIR /app

COPY pom.xml .

COPY src ./src

# Use the deployment configuration template
# as the real Spring Boot configuration
RUN cp src/main/resources/application.properties.example src/main/resources/application.properties

RUN mvn clean package -DskipTests

FROM eclipse-temurin:24-jre

WORKDIR /app

COPY --from=build /app/target/shiptrack-pro-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]