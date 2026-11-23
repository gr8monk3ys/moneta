# Moneta

Moneta is a mobile finance-learning app. This backend serves the curriculum, tracks each learner's mastery and streak, and records their Pro subscription state.

## Curriculum

**Lesson**:
A unit of study with a title, a level, a track and a list of lesson items.
_Avoid_: Module, course

**Lesson item**:
A single question inside a lesson, tied to one skill and answered as `mcq`, `numeric` or `scenario`.
_Avoid_: Question, exercise

**Finance level**:
One of six difficulty tiers, `F1` to `F6`, that orders lessons and describes a learner's current standing.
_Avoid_: Grade, tier

**Track**:
Whether a lesson belongs to the `core` or the `advanced` curriculum.
_Avoid_: Path, course

**Premium lesson**:
A lesson only learners with the advanced-tracks feature may open or complete.
_Avoid_: Paid lesson, locked lesson

**Editorial review**:
The `approved` or `provisional` sign-off status of a lesson's content.
_Avoid_: Content approval

## Learning

**Skill**:
A named competency, such as investing, that each lesson item exercises and that carries a mastery value per learner.
_Avoid_: Topic, concept

**Mastery**:
A 0 to 1 estimate of how well a learner knows a skill; at or above the mastery threshold (0.8) the skill counts as mastered.
_Avoid_: Score, proficiency

**Placement**:
The onboarding test whose score assigns a learner their starting finance level.
_Avoid_: Assessment, quiz

**Review item**:
A skill the learner should revisit once its due date arrives, scheduled by spaced repetition from mastery.
_Avoid_: Flashcard

**Today's lesson**:
The next lesson the learning path recommends for a learner, returned by `/api/learn/today`.
_Avoid_: Daily lesson

**Completion record**:
The stored result of a finished lesson: score, correct count and total items.
_Avoid_: Attempt

**Streak**:
The count of consecutive days a learner has had session activity, kept in the learner's time zone.
_Avoid_: Run

**Streak repair**:
A Pro-only action that restores a streak broken by exactly one missed day.
_Avoid_: Streak freeze

## Accounts and billing

**Auth user**:
The credentialed identity (email and password hash) that owns a user profile.
_Avoid_: Account holder

**User profile**:
A learner's learning state: current level, streak, skills, completion records and entitlement.
_Avoid_: Learner record

**Refresh token**:
A rotating, hashed token tied to a session that lets a client obtain a new access token.
_Avoid_: Session token

**Entitlement**:
A user's subscription state: plan, whether it is active, its source and its period end.
_Avoid_: Subscription, license

**Plan**:
Either `free` or `pro`.
_Avoid_: Tier

**Feature access**:
The set of capabilities an entitlement unlocks: advanced tracks, certificates, streak repair and unlimited reviews.
_Avoid_: Permissions

**Billing webhook event**:
A store or web notification, recorded once by its event id, that changes a user's entitlement.
_Avoid_: Payment event

**Entitlement sync**:
A client-initiated update of an entitlement from a store purchase, rejected when it is stale.
_Avoid_: Purchase restore
