clean up?

if people abandon a game mid-way or its never started, we will want to clean it up, but its not critical,

as we will just prevent users from creating new games.

what about the players?

players should only be able to be in one game at a time

allow players to move to a new game whenever, but it just overwrites the previous

trigger.dev or a lambda to call a webhook for clean up

---

question sourcing

MVP0
May just need to force people to wait to create a game room. Should be approximately 30 seconds

MVP1
when a new game is created, immediately fetch the questions

after the first 5 questions, trigger the webhook

after finishing, trigger the webhook again

by the time people join it should be nearly finished

---

question creation takes approximately 5 seconds

---

what about timers?

15 seconds for each question, then move to the next
