1. npm install
2. docker-compose up -d
3. npm run migrate
4. npm run seed
5. npm run dev

Typical flow:

1. login as admin
2. create a survey (draft)
3. update the survey:

- title, categories, questions can be modified as long as survey is in Draft status
- once survey's status is updated to Published it can no longer be edited

4. if survey is Published users can be invited to take the survey
5. users can answer the questions of a survey as long as it's status is Draft - user survey is updated
6. once they submit the survey they can no longer modify it - it's status is Submitted
7. admins can fetch the list of all surveys - with title, categories and status fields, as well as count
8. admins can search the surveys by title and filter by category and status
9. users can fetch the list of all the surveys they participated in, with title, categories, status and count
10. users can search the surveys by title and filter by category and status
11. admin can fetch one survey
12. users can fetch one of their user surveys
13. admin can add a category
14. admin can list categories, searching by name and filtering by status
15. admin can archive a category (soft delete)
