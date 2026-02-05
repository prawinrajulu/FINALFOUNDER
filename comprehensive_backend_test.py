#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Campus Lost & Found System
Review Request Test Scenarios Implementation
"""

import requests
import json
import sys
from datetime import datetime

class ComprehensiveBackendTester:
    def __init__(self, base_url="https://findly-analytics.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.sam_token = None
        self.raju_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Test data storage
        self.jewellery_item_id = None
        self.phone_item_id = None
        self.found_item_id = None
        self.claim_id = None

    def log_result(self, test_name, success, details=""):
        """Log test result with detailed output"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            self.failed_tests.append(f"{test_name}: {details}")
            print(f"❌ {test_name} - FAILED: {details}")
        if details:
            print(f"   Details: {details}")

    def make_request(self, method, endpoint, data=None, files=None, headers=None, token=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        
        if token:
            default_headers['Authorization'] = f'Bearer {token}'
        
        if headers:
            default_headers.update(headers)
        
        # Remove Content-Type for file uploads
        if files:
            default_headers.pop('Content-Type', None)
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=default_headers, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=30)
            
            return response
        except requests.exceptions.Timeout:
            print(f"Request timeout for {method} {endpoint}")
            return None
        except requests.exceptions.ConnectionError:
            print(f"Connection error for {method} {endpoint}")
            return None
        except Exception as e:
            print(f"Request error for {method} {endpoint}: {str(e)}")
            return None

    def authenticate_users(self):
        """Authenticate all required users"""
        print("\n🔐 AUTHENTICATING USERS...")
        
        # Admin login - try both passwords
        admin_success = False
        for password in ["SuperAdmin@123", "#123321#"]:
            response = self.make_request('POST', 'auth/admin/login', {
                "username": "superadmin",
                "password": password
            })
            
            if response and response.status_code == 200:
                data = response.json()
                self.admin_token = data.get('token')
                self.log_result("Admin Authentication", True, f"Password: {password}")
                admin_success = True
                break
        
        if not admin_success:
            self.log_result("Admin Authentication", False, "Both passwords failed")
            return False
        
        # Student Sam login
        response = self.make_request('POST', 'auth/student/login', {
            "roll_number": "112723205028",
            "dob": "17-04-2006"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.sam_token = data.get('token')
            self.log_result("Sam Student Authentication", True, "Login successful")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Sam Student Authentication", False, error_msg)
            return False
        
        # Student RAJU login
        response = self.make_request('POST', 'auth/student/login', {
            "roll_number": "112723205047",
            "dob": "23-04-2006"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.raju_token = data.get('token')
            self.log_result("RAJU Student Authentication", True, "Login successful")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("RAJU Student Authentication", False, error_msg)
            return False
        
        return True

    def test_jewellery_priority_lost_item_creation(self):
        """Test Scenario 1: Jewellery Priority Test - Lost Item Creation"""
        print("\n💎 TEST SCENARIO 1: JEWELLERY PRIORITY - LOST ITEM CREATION")
        
        # Create Jewellery lost item as Sam
        url = f"{self.base_url}/items"
        headers = {'Authorization': f'Bearer {self.sam_token}'}
        
        jewellery_data = {
            'item_type': 'lost',
            'item_keyword': 'Jewellery',
            'description': 'Gold necklace with pendant - family heirloom with intricate design and small ruby stone',
            'location': 'Main Building Washroom',
            'approximate_time': 'Morning',
            'secret_message': 'The pendant has my initials "S.K." engraved on the back and a small scratch near the clasp'
        }
        
        try:
            response = requests.post(url, data=jewellery_data, headers=headers)
        except Exception as e:
            self.log_result("Create Jewellery Lost Item", False, f"Request error: {str(e)}")
            return False
        
        if response and response.status_code == 200:
            data = response.json()
            self.jewellery_item_id = data.get('item_id')
            success = 'successfully' in data.get('message', '')
            self.log_result("Create Jewellery Lost Item", success,
                          f"Item ID: {self.jewellery_item_id}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Create Jewellery Lost Item", False, error_msg)
            return False
        
        # Create Phone lost item as Sam
        phone_data = {
            'item_type': 'lost',
            'item_keyword': 'Phone',
            'description': 'Black iPhone 14 with cracked screen protector and blue case',
            'location': 'Library 2nd Floor',
            'approximate_time': 'Afternoon',
            'secret_message': 'Phone has a small dent on the bottom right corner and my name sticker inside the case'
        }
        
        try:
            response = requests.post(url, data=phone_data, headers=headers)
        except Exception as e:
            self.log_result("Create Phone Lost Item", False, f"Request error: {str(e)}")
            return False
        
        if response and response.status_code == 200:
            data = response.json()
            self.phone_item_id = data.get('item_id')
            success = 'successfully' in data.get('message', '')
            self.log_result("Create Phone Lost Item", success,
                          f"Item ID: {self.phone_item_id}")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Create Phone Lost Item", False, error_msg)
            return False

    def test_jewellery_priority_listing(self):
        """Test Scenario 2: Jewellery Priority Test - Lost Items Listing"""
        print("\n📋 TEST SCENARIO 2: JEWELLERY PRIORITY - LOST ITEMS LISTING")
        
        # Get public items filtered for lost type
        response = self.make_request('GET', 'items/public', token=self.sam_token)
        
        if response and response.status_code == 200:
            items = response.json()
            
            # Filter for lost items
            lost_items = [item for item in items if item.get('item_type') == 'lost']
            
            if not lost_items:
                self.log_result("Jewellery Priority Listing", False, "No lost items found")
                return False
            
            # Check if jewellery items appear first
            jewellery_items = [item for item in lost_items if item.get('item_keyword', '').lower() == 'jewellery']
            phone_items = [item for item in lost_items if item.get('item_keyword', '').lower() == 'phone']
            
            jewellery_first = True
            if jewellery_items and phone_items:
                # Find positions
                jewellery_positions = [lost_items.index(item) for item in jewellery_items]
                phone_positions = [lost_items.index(item) for item in phone_items]
                
                # Check if all jewellery items come before all phone items
                max_jewellery_pos = max(jewellery_positions) if jewellery_positions else -1
                min_phone_pos = min(phone_positions) if phone_positions else float('inf')
                
                jewellery_first = max_jewellery_pos < min_phone_pos
            
            # Verify response structure
            proper_structure = True
            if lost_items:
                sample_item = lost_items[0]
                required_fields = ['id', 'item_type', 'item_keyword', 'description', 'location']
                proper_structure = all(field in sample_item for field in required_fields)
            
            success = jewellery_first and proper_structure
            self.log_result("Jewellery Priority Listing", success,
                          f"Jewellery first: {jewellery_first}, Proper structure: {proper_structure}, "
                          f"Lost items count: {len(lost_items)}")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Jewellery Priority Listing", False, error_msg)
            return False

    def test_full_claims_flow(self):
        """Test Scenario 3: Full Claims Flow Test"""
        print("\n🎯 TEST SCENARIO 3: FULL CLAIMS FLOW TEST")
        
        # First, create a found item as Sam
        url = f"{self.base_url}/items"
        headers = {'Authorization': f'Bearer {self.sam_token}'}
        
        found_data = {
            'item_type': 'found',
            'item_keyword': 'Wallet',
            'description': 'Brown leather wallet found in cafeteria with some cards and cash inside',
            'location': 'Main Cafeteria',
            'approximate_time': 'Morning',
            'secret_message': 'Wallet contains a student ID card with photo, driving license, and two credit cards'
        }
        
        try:
            response = requests.post(url, data=found_data, headers=headers)
        except Exception as e:
            self.log_result("Create Found Item for Claims", False, f"Request error: {str(e)}")
            return False
        
        if response and response.status_code == 200:
            data = response.json()
            self.found_item_id = data.get('item_id')
            self.log_result("Create Found Item for Claims", True,
                          f"Item ID: {self.found_item_id}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Create Found Item for Claims", False, error_msg)
            return False
        
        # Now login as RAJU and get found items
        response = self.make_request('GET', 'items/public', token=self.raju_token)
        
        if response and response.status_code == 200:
            items = response.json()
            found_items = [item for item in items if item.get('item_type') == 'found']
            
            self.log_result("Get Found Items List", len(found_items) > 0,
                          f"Found items count: {len(found_items)}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Get Found Items List", False, error_msg)
            return False
        
        # Submit a claim with proper qa_data as RAJU
        claim_data = {
            "item_id": self.found_item_id,
            "message": "This is my wallet that I lost yesterday in the cafeteria"
        }
        
        response = self.make_request('POST', 'claims', claim_data, token=self.raju_token)
        
        if response and response.status_code == 200:
            data = response.json()
            self.claim_id = data.get('claim_id')
            success = 'submitted' in data.get('message', '')
            
            self.log_result("Submit Claim with QA Data", success,
                          f"Claim ID: {self.claim_id}")
            
            # Verify claim was created with pending status
            if self.claim_id:
                claim_response = self.make_request('GET', f'claims/{self.claim_id}', token=self.admin_token)
                if claim_response and claim_response.status_code == 200:
                    claim_details = claim_response.json()
                    status_pending = claim_details.get('status') == 'pending'
                    has_qa_data = 'qa_data' in claim_details or 'claim_data' in claim_details
                    
                    self.log_result("Verify Claim Status and QA Data", status_pending and has_qa_data,
                                  f"Status: {claim_details.get('status')}, Has QA data: {has_qa_data}")
                else:
                    self.log_result("Verify Claim Status and QA Data", False, "Could not retrieve claim details")
            
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Submit Claim with QA Data", False, error_msg)
            return False

    def test_admin_claim_review_flow(self):
        """Test Scenario 4: Admin Claim Review Flow"""
        print("\n👨‍💼 TEST SCENARIO 4: ADMIN CLAIM REVIEW FLOW")
        
        if not self.claim_id:
            self.log_result("Admin Claim Review Flow", False, "No claim ID available")
            return False
        
        # Get pending claims as admin
        response = self.make_request('GET', 'claims?status=pending', token=self.admin_token)
        
        if response and response.status_code == 200:
            claims = response.json()
            pending_claims = [claim for claim in claims if claim.get('status') == 'pending']
            
            self.log_result("Get Pending Claims", len(pending_claims) > 0,
                          f"Pending claims count: {len(pending_claims)}")
            
            # Find our specific claim
            our_claim = next((claim for claim in pending_claims if claim.get('id') == self.claim_id), None)
            if our_claim:
                has_qa_data = 'qa_data' in our_claim or 'claim_data' in our_claim
                self.log_result("Verify Claim Details Include QA Data", has_qa_data,
                              f"QA data present: {has_qa_data}")
            else:
                self.log_result("Verify Claim Details Include QA Data", False, "Our claim not found in pending list")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Get Pending Claims", False, error_msg)
            return False
        
        # Approve claim with proper reason
        decision_data = {
            "status": "approved",
            "reason": "Student provided valid identification details and description matches the found wallet perfectly. All verification questions answered correctly."
        }
        
        response = self.make_request('POST', f'claims/{self.claim_id}/decision', decision_data, token=self.admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            success = 'approved' in data.get('message', '')
            
            self.log_result("Approve Claim with Reason", success,
                          f"Decision: {data.get('message')}")
            
            # Verify status changed correctly
            claim_response = self.make_request('GET', f'claims/{self.claim_id}', token=self.admin_token)
            if claim_response and claim_response.status_code == 200:
                claim_details = claim_response.json()
                status_approved = claim_details.get('status') == 'approved'
                has_reason = claim_details.get('admin_decision', {}).get('reason') is not None
                
                self.log_result("Verify Status Change", status_approved and has_reason,
                              f"Status: {claim_details.get('status')}, Has reason: {has_reason}")
            
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Approve Claim with Reason", False, error_msg)
            return False

    def test_messages_notifications_api(self):
        """Test Scenario 5: Messages/Notifications API Test"""
        print("\n📨 TEST SCENARIO 5: MESSAGES/NOTIFICATIONS API TEST")
        
        # Test as student Sam
        response = self.make_request('GET', 'messages', token=self.sam_token)
        
        if response and response.status_code == 200:
            messages = response.json()
            is_list = isinstance(messages, list)
            
            # Check notification structure
            proper_structure = True
            if messages:
                sample_message = messages[0]
                required_fields = ['id', 'content', 'created_at']
                proper_structure = all(field in sample_message for field in required_fields)
                
                # Check for notification_type if present
                has_notification_type = 'notification_type' in sample_message
            else:
                has_notification_type = True  # No messages is also valid
            
            success = is_list and proper_structure
            self.log_result("Messages/Notifications API", success,
                          f"Messages count: {len(messages)}, Proper structure: {proper_structure}, "
                          f"Has notification type: {has_notification_type}")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Messages/Notifications API", False, error_msg)
            return False

    def test_items_api_health_check(self):
        """Test Scenario 6: Items API Health Check"""
        print("\n🏥 TEST SCENARIO 6: ITEMS API HEALTH CHECK")
        
        # Test GET /api/items/public
        response = self.make_request('GET', 'items/public', token=self.sam_token)
        
        if response and response.status_code == 200:
            items = response.json()
            is_list = isinstance(items, list)
            
            # Check proper structure
            proper_structure = True
            if items:
                sample_item = items[0]
                required_fields = ['id', 'item_type', 'description', 'location', 'student']
                proper_structure = all(field in sample_item for field in required_fields)
            
            self.log_result("GET /api/items/public", is_list and proper_structure,
                          f"Items count: {len(items)}, Proper structure: {proper_structure}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("GET /api/items/public", False, error_msg)
        
        # Test GET /api/items/my
        response = self.make_request('GET', 'items/my', token=self.sam_token)
        
        if response and response.status_code == 200:
            my_items = response.json()
            is_list = isinstance(my_items, list)
            
            self.log_result("GET /api/items/my", is_list,
                          f"My items count: {len(my_items)}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("GET /api/items/my", False, error_msg)
        
        # Test POST /api/items (create new item)
        url = f"{self.base_url}/items"
        headers = {'Authorization': f'Bearer {self.sam_token}'}
        
        test_item_data = {
            'item_type': 'lost',
            'item_keyword': 'Keys',
            'description': 'Set of keys with blue keychain and house key',
            'location': 'Parking Area',
            'approximate_time': 'Evening',
            'secret_message': 'Keys have a Toyota car key and my apartment key with number 42 tag'
        }
        
        try:
            response = requests.post(url, data=test_item_data, headers=headers)
        except Exception as e:
            self.log_result("POST /api/items", False, f"Request error: {str(e)}")
            return False
        
        if response and response.status_code == 200:
            data = response.json()
            test_item_id = data.get('item_id')
            success = 'successfully' in data.get('message', '')
            
            self.log_result("POST /api/items", success,
                          f"Created item ID: {test_item_id}")
            
            # Test DELETE /api/items/{id} (soft delete)
            if test_item_id:
                delete_data = {"reason": "Test item - no longer needed"}
                delete_response = self.make_request('DELETE', f'items/{test_item_id}', delete_data, token=self.sam_token)
                
                if delete_response and delete_response.status_code == 200:
                    delete_result = delete_response.json()
                    delete_success = 'deleted successfully' in delete_result.get('message', '')
                    
                    self.log_result("DELETE /api/items/{id}", delete_success,
                                  f"Delete result: {delete_result.get('message')}")
                else:
                    error_msg = delete_response.json().get('detail', 'Unknown error') if delete_response else 'No response'
                    self.log_result("DELETE /api/items/{id}", False, error_msg)
            
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("POST /api/items", False, error_msg)
            return False

    def run_comprehensive_tests(self):
        """Run all comprehensive backend tests"""
        print("="*80)
        print("🎯 COMPREHENSIVE BACKEND TESTING - CAMPUS LOST & FOUND SYSTEM")
        print("="*80)
        
        # Authenticate users
        if not self.authenticate_users():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return False
        
        # Run all test scenarios
        self.test_jewellery_priority_lost_item_creation()
        self.test_jewellery_priority_listing()
        self.test_full_claims_flow()
        self.test_admin_claim_review_flow()
        self.test_messages_notifications_api()
        self.test_items_api_health_check()
        
        # Print summary
        print("\n" + "="*80)
        print("📊 TEST SUMMARY")
        print("="*80)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"   • {failure}")
        else:
            print("\n🎉 ALL TESTS PASSED!")
        
        return len(self.failed_tests) == 0

if __name__ == "__main__":
    tester = ComprehensiveBackendTester()
    success = tester.run_comprehensive_tests()
    sys.exit(0 if success else 1)