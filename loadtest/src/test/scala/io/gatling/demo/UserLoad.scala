package io.gatling.demo

import scala.concurrent.duration._
import io.gatling.core.Predef._
import io.gatling.http.Predef._

class UserLoad extends Simulation {

  val firebaseKey = sys.env.getOrElse("VITE_FIREBASE_API_KEY", "")

  val feeder = csv("credentials.csv").circular

  val httpProtocol = http
    .baseUrl(sys.env.getOrElse("TARGET_URL", "http://localhost:3000"))
    .acceptHeader("application/json")

  val scn = scenario("GET /users/me load test")
    .feed(feeder)
    .exec(
      http("Firebase login")
        .post(s"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$firebaseKey")
        .header("Content-Type", "application/json")
        .body(StringBody("""{"email":"#{email}","password":"#{password}","returnSecureToken":true}"""))
        .check(status.is(200))
        .check(jsonPath("$.idToken").saveAs("idToken"))
    )
    .exec(
      http("GET /users/me")
        .get("/users/me")
        .header("authorization", "Bearer #{idToken}")
        .check(status.is(200))
    )

  setUp(
    scn.inject(rampUsers(10).during(10.seconds))
  ).protocols(httpProtocol)
}