FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /app

COPY .mvn .mvn
COPY mvnw pom.xml ./

RUN chmod +x mvnw

COPY src src

RUN ./mvnw -B clean package -DskipTests


FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -S tracepass \
    && adduser -S tracepass -G tracepass

COPY --from=build /app/target/*.jar app.jar

USER tracepass

ENV PORT=8080

EXPOSE 8080

ENTRYPOINT ["sh","-c","java -XX:MaxRAMPercentage=75.0 -Dserver.port=${PORT} -jar app.jar"]