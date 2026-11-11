## ADDED Requirements

### Requirement: Open full page when saving is unavailable
When the game runs embedded in another site's frame and the browser blocks saving there, the parent corner SHALL say that progress cannot be saved in this frame and SHALL offer to open the game as a full page, where saving works. This option SHALL appear only in the parent corner, never to the child.

#### Scenario: Safari blocks storage in the frame
- **WHEN** the game runs inside the itch.io frame on a browser that blocks its storage, and an adult opens the parent corner
- **THEN** a note explains saving is unavailable here, with an option to open the game full page

#### Scenario: Saving works
- **WHEN** saving works normally
- **THEN** the parent corner shows no such note
