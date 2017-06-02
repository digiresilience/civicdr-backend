## API

### 🚉 Routes

`/tickets`
  - `GET`: Returns all tickets.
  - `POST`: Create a new ticket.

`/tickets/:id`
  - `GET`: Returns the ticket with the provided id.
  - `PUT`: Update the ticket with the provided id.
  - `DELETE`: Delete the ticket with the provided id.

`/tickets/:id/groupings/:grouping_id`
  - `POST`: Add a grouping with `grouping_id` to a ticket with the provided id.
  - `DELETE`: Delete a grouping with `grouping_id` from a ticket with the provided id.

`/tickets/:id/ip_profiles/:profile_id`
  - `POST`: Assign the ticket with the provided id to the IP with id `profile_id`.

`/tickets/:id/sp_profiles/:profile_id`
  - `POST`: Assign the ticket with the provided id to the SP with id `profile_id`.
  - `DELETE`: Unassign the ticket with the provided id to the SP with id `profile_id`.

`/tickets/:ticket_id/threads`
  - `GET`: Returns the threads for a ticket with the provided ticket id.

`/groupings`
  - `GET`: Returns all groupings.
  - `POST`: Create a new grouping.

`/groupings/:id`
  - `GET`: Returns the grouping with the provided id.
  - `PUT`: Update the grouping with the provided id.
  - `DELETE`: Delete the grouping with the provided id.

`/groupings/:grouping_id/threads`
  - `GET`: Returns the threads for a grouping with the provided grouping id.

`/ip_profiles`
  - `GET` Return all IP profiles.
  - `POST` Create a new IP profile.

`/ip_profiles/:id`
  - `GET`: Returns the IP profile with the provided id.
  - `PUT`: Update the IP profile with the provided id.
  - `DELETE`: Delete the IP profile with the provided id.

`/sp_profiles`
  - `GET` Return all SP profiles.
  - `POST` Create a new SP profile.

`/sp_profiles/:id`
  - `GET`: Returns the SP profile with the provided id.
  - `PUT`: Update the SP profile with the provided id.
  - `DELETE`: Delete the SP profile with the provided id.

`/threads/:thread_id`
  - `GET`: Returns a thread and messages with the provided thread id.

`/threads/:thread_id/messages`
  - `POST`: Add a message to a thread with the provided id.

`/messages/:message_id`
  - `DELETE`: Delete a message with the provided `message_id`.
