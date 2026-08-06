## ADDED Requirements

### Requirement: Source and privacy pages are available as informational resources

The system SHALL provide the current source-data and privacy informational pages.

#### Scenario: Source page is opened

- WHEN a user opens `/menu/source`
- THEN the system SHALL render the current source-data page, including the source table view

#### Scenario: Privacy page is opened

- WHEN a user opens `/menu/privacy`
- THEN the system SHALL render the current privacy and citation page

### Requirement: About page exposes the current tabbed informational sections

The system SHALL provide the current about-page tabs for intro, suggestion, like/support, and settings.

#### Scenario: About intro tab is opened

- WHEN a user opens `/menu/about/intro`
- THEN the system SHALL render the about intro content

#### Scenario: About settings tab is opened

- WHEN a user opens `/menu/settings`
- THEN the system SHALL render the current settings content, including language switching

### Requirement: Intro route exposes the current standalone intro views

The system SHALL preserve the current standalone intro route and its tab-driven child view selection.

#### Scenario: Intro route is opened with a supported tab query

- WHEN a user opens `/intro` with a supported `tab` query
- THEN the system SHALL render the matching standalone intro child view
