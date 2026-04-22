# Bug-Tracking-Web-App
A web-based application designed to track the assignment, status, and progress of bugs and issues related to software projects.  



FUNCTIONAL REQUIREMENTS
HIGH LEVEL REQUIREMENTS
The system must allow the user to:
• Create issues
• Assign issues
• View all issues
• View a particular issue
• Edit issues
• Create people 1
• Create projects2
CREATING AN ISSUE (TICKET)
The following information is required:
• Summary of the issue that was discovered
• Detailed description of the issue
• Who identified the issue
• The date on which the issue was identified
• Which project the issue is related to
• Who the issue is assigned to
• A status of the issue [open/ resolved/ overdue]
1 You can use static values in the database as opposed to using a form.
2 You can use static values in the database as opposed to using a form
• Priority of the issue [ low/ medium/ high]
• Target resolution date
• Actual resolution date
• Resolution summary
LOW LEVEL REQUIREMENTS
ASSIGNING AN ISSUE (TICKET)
• Once all the ticket information has been recorded, you must select a person to fix the issue.
• It is possible to create a ticket and assign the issue to a person later.
VIEW ALL ISSUES (TICKETS)
• See the example in figure 1, showing limited details for all issues.
• Consider how the UI could be affected if there are too many issues that have been recorded. •
Decide on the details that make sense
VIEW AN ISSUE (TICKET)
• The system must display all the details for that issue. See Creating an issue.
EDITING OF AN ISSUE
• Summary of all issues
• Detailed issue
• All issues by project *Bonus
CREATING PEOPLE
• A person must have an id, name, surname, email address, and unique username. Add a profile picture for
bonus marks.
CREATING PROJECTS
• A project must have an id and name. A name is any valid string.
DATA REQUIREMENTS
The following data needs to be persisted across sessions:
• Projects: A list all current projects.
• People: A collection of information about who can be assigned to handle issues
• Bugs: Information about an issue, including the project to which it is related, and the person assigned
to the issue