# Project Apollo — Engineering Handbook (Team Alpha)

Sample document for evaluating the Document Assistant. Upload it to **Workspace A** only.
All names and facts are fictional.

## Stack

Project Apollo uses PostgreSQL 16 as its primary database. Nightly backups are kept for 14 days.
The API is written in Go and deployed to the Frankfurt region.

## Release process

Releases go out every second Tuesday. A release needs two code-review approvals and a green
staging run. Hotfixes can skip the schedule but still need one approval.

## On-call

The on-call rotation is one week long and hands over on Monday at 10:00 CET.
The on-call engineer must acknowledge a P1 alert within 15 minutes.

## Codename

The internal codename for the Q4 analytics project is BLUE HERON.
