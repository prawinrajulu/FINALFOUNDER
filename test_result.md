#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  System redesign for Campus Lost & Found Management System to fix logical errors:
  A. Authentication - Landing page with only Student/Admin login (no public lobby before auth)
  B. Admin Students - Department + Year context switch before viewing/uploading
  C. Core Semantics - Claims ONLY for FOUND items, "I Found This" for LOST items
  D. AI Advisory Only - Confidence bands (LOW/MEDIUM/HIGH) instead of percentages
  E. Admin Accountability - Mandatory reason for claim decisions
  F. Image Optional - Allow text-only item reports

backend:
  - task: "Health check endpoint"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Added /api/health endpoint for monitoring"

  - task: "Lobby requires authentication"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Changed lobby endpoints to require authentication with get_current_user dependency"

  - task: "Students by context (Department + Year)"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Added /api/students/by-context and /api/students/contexts endpoints"

  - task: "I Found This response for LOST items"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Added /api/items/{id}/found-response endpoint for LOST items"

  - task: "Claims only for FOUND items"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Claims and AI claims now validate item_type == found"

  - task: "AI confidence bands (not percentages)"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "AI returns confidence_band (LOW/MEDIUM/HIGH) instead of percentage"

  - task: "Mandatory reason for claim decisions"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "ClaimDecision now requires reason field, minimum 10 chars"

  - task: "Image optional for items"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Item creation now accepts optional image"

  - task: "Rate limiting on claims"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Added 5 claims/day and 3 found-responses/day limits"

frontend:
  - task: "Landing page (login options only)"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/LandingPage.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "New landing page with Student/Admin login only, no public lobby"

  - task: "Authenticated lobby route"
    implemented: true
    working: "NA"
    file: "frontend/src/App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Lobby now requires auth via AuthenticatedRoute wrapper"

  - task: "Role badge in header"
    implemented: true
    working: "NA"
    file: "frontend/src/components/Header.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Added RoleBadge component showing logged-in role"

  - task: "I Found This page for LOST items"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/FoundResponsePage.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "New page for responding to LOST items (separate from claims)"

  - task: "Semantic action buttons in lobby"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/PublicPage.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Claim for FOUND items, I Found This for LOST items"

  - task: "AI confidence bands display"
    implemented: true
    working: "NA"
    file: "frontend/src/components/AIClaimChat.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Shows LOW/MEDIUM/HIGH instead of percentage"

  - task: "Mandatory reason for claim decisions"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/AdminClaims.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Admin must provide reason (min 10 chars) for approve/reject"

  - task: "Optional image in report forms"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/ReportLostPage.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Image is now optional, description validation added"

metadata:
  created_by: "main_agent"
  version: "2.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "Landing page (login options only)"
    - "Lobby requires authentication"
    - "Claims only for FOUND items"
    - "I Found This response for LOST items"
    - "Mandatory reason for claim decisions"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      MAJOR SYSTEM REDESIGN IMPLEMENTED:
      
      1. AUTHENTICATION/NAVIGATION:
         - New LandingPage.js with only Student Login and Admin Login buttons
         - No public browsing before login
         - Lobby (/lobby) now requires authentication
         - Role badge shows in header after login
      
      2. SEMANTIC FIX - Claims vs Found Responses:
         - Claims are ONLY for FOUND items (ownership verification)
         - LOST items get "I Found This" button (new FoundResponsePage.js)
         - Backend validates item_type before accepting claims
      
      3. AI ADVISORY ONLY:
         - Returns confidence_band (LOW/MEDIUM/HIGH) instead of percentage
         - Shows inconsistencies if detected
         - Clear disclaimer that AI doesn't make decisions
      
      4. ADMIN ACCOUNTABILITY:
         - Reason is MANDATORY for claim approve/reject (min 10 chars)
         - Audit logs include reason and admin info
      
      5. IMAGE OPTIONAL:
         - Can report items without images
         - Description validation (min 20 chars)
      
      6. RATE LIMITING:
         - Max 5 claims per day per user
         - Max 3 found-responses per day per user
      
      TEST LOGIN CREDENTIALS:
      - Student: roll_number + DOB (DD-MM-YYYY)
      - Admin: superadmin / SuperAdmin@123
      
      Please test the backend endpoints first, focusing on:
      1. GET /api/health - should work without auth
      2. GET /api/lobby/items - should require auth
      3. POST /api/items/{id}/found-response - for LOST items only
      4. POST /api/claims - should reject if item is LOST
      5. POST /api/claims/{id}/decision - should require reason