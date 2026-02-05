import requests
import sys
import json
from datetime import datetime

class LostFoundLinkingTester:
    def __init__(self, base_url="https://findly-analytics.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.sam_token = None
        self.raju_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Test data storage
        self.sam_lost_item_id = None
        self.raju_found_item_id = None
        self.notification_id = None

    def log_result(self, test_name, success, details=""):
        """Log test result"""
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

    def login_admin(self):
        """Login as admin"""
        print("\n🔐 Logging in as Admin...")
        
        response = self.make_request('POST', 'auth/admin/login', {
            "username": "superadmin",
            "password": "SuperAdmin@123"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.admin_token = data.get('token')
            self.log_result("Admin Login", True, f"Role: {data.get('role')}")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Admin Login", False, f"Error: {error_msg}")
            return False

    def login_sam_student(self):
        """Login as Sam student (112723205028 / 17-04-2006)"""
        print("\n👨‍🎓 Logging in as Sam Student...")
        
        response = self.make_request('POST', 'auth/student/login', {
            "roll_number": "112723205028",
            "dob": "17-04-2006"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.sam_token = data.get('token')
            self.log_result("Sam Student Login", True, f"Logged in as Sam")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Sam Student Login", False, f"Error: {error_msg}")
            return False

    def login_raju_student(self):
        """Login as RAJU student (112723205047 / 23-04-2006)"""
        print("\n👨‍🎓 Logging in as RAJU Student...")
        
        response = self.make_request('POST', 'auth/student/login', {
            "roll_number": "112723205047",
            "dob": "23-04-2006"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.raju_token = data.get('token')
            self.log_result("RAJU Student Login", True, f"Logged in as RAJU")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("RAJU Student Login", False, f"Error: {error_msg}")
            return False

    def test_get_matching_lost_items(self):
        """Test 1: GET /api/items/lost/matching - Search for matching lost items"""
        print("\n🔍 Testing GET /api/items/lost/matching...")
        
        # Test with keyword search
        response = self.make_request('GET', 'items/lost/matching?keyword=Phone', token=self.raju_token)
        
        if response and response.status_code == 200:
            lost_items = response.json()
            is_list = isinstance(lost_items, list)
            
            # Check structure
            has_proper_structure = True
            includes_student_info = True
            excludes_secret_message = True
            
            if lost_items:
                sample_item = lost_items[0]
                required_fields = ['id', 'item_type', 'item_keyword', 'description', 'location', 'student']
                has_proper_structure = all(field in sample_item for field in required_fields)
                
                # Check item_type is 'lost'
                is_lost_type = sample_item.get('item_type') == 'lost'
                
                # Check student info is included but safe (no sensitive data)
                student_info = sample_item.get('student', {})
                includes_student_info = 'full_name' in student_info and 'department' in student_info
                
                # Check secret_message is NOT included
                excludes_secret_message = 'secret_message' not in sample_item
                
                success = is_list and has_proper_structure and is_lost_type and includes_student_info and excludes_secret_message
                self.log_result("GET Lost Matching Items", success,
                              f"Items found: {len(lost_items)}, Proper structure: {has_proper_structure}, Safe student info: {includes_student_info}, No secret: {excludes_secret_message}")
            else:
                # No items found is also valid
                self.log_result("GET Lost Matching Items", True, "No matching lost items found (valid response)")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("GET Lost Matching Items", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")

    def create_lost_item_as_sam(self):
        """Create a LOST item as Sam for linking tests"""
        print("\n📱 Creating LOST Item as Sam...")
        
        url = f"{self.base_url}/items"
        headers = {'Authorization': f'Bearer {self.sam_token}'}
        
        form_data = {
            'item_type': 'lost',
            'item_keyword': 'Phone',
            'description': 'Black iPhone 14 Pro with cracked screen protector. Has a blue silicone case with university logo sticker.',
            'location': 'Library 2nd Floor Study Area',
            'approximate_time': 'Afternoon',
            'secret_message': 'Phone has a small scratch near the camera lens and my initials "S.K." engraved on the back of the case'
        }
        
        try:
            response = requests.post(url, data=form_data, headers=headers, timeout=30)
        except Exception as e:
            self.log_result("Create LOST Item (Sam)", False, f"Request error: {str(e)}")
            return False
        
        if response and response.status_code == 200:
            data = response.json()
            self.sam_lost_item_id = data.get('item_id')
            success = 'successfully' in data.get('message', '')
            
            self.log_result("Create LOST Item (Sam)", success,
                          f"Lost Item ID: {self.sam_lost_item_id}")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Create LOST Item (Sam)", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
            return False

    def create_linked_found_item_as_raju(self):
        """Test 2: POST /api/items with related_lost_item_id - Create linked found item"""
        print("\n📱 Testing Create Linked FOUND Item as RAJU...")
        
        if not self.sam_lost_item_id:
            self.log_result("Create Linked FOUND Item", False, "No lost item ID available for linking")
            return False
        
        url = f"{self.base_url}/items"
        headers = {'Authorization': f'Bearer {self.raju_token}'}
        
        form_data = {
            'item_type': 'found',
            'item_keyword': 'Phone',
            'description': 'Found a black iPhone with blue case in the library. Screen protector is cracked.',
            'location': 'Library 2nd Floor Near Study Tables',
            'approximate_time': 'Evening',
            'secret_message': 'Phone has some scratches and appears to have initials on the case',
            'related_lost_item_id': self.sam_lost_item_id  # Link to Sam's lost item
        }
        
        try:
            response = requests.post(url, data=form_data, headers=headers, timeout=30)
        except Exception as e:
            self.log_result("Create Linked FOUND Item", False, f"Request error: {str(e)}")
            return False
        
        if response and response.status_code == 200:
            data = response.json()
            self.raju_found_item_id = data.get('item_id')
            success = 'successfully' in data.get('message', '')
            
            self.log_result("Create Linked FOUND Item", success,
                          f"Found Item ID: {self.raju_found_item_id}, Linked to: {self.sam_lost_item_id}")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Create Linked FOUND Item", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
            return False

    def test_notification_created(self):
        """Test 3: Check notification created - Verify notification sent to Sam"""
        print("\n📬 Testing Notification Created for Lost Item Owner...")
        
        # Get messages for Sam to check for notification
        response = self.make_request('GET', 'messages', token=self.sam_token)
        
        if response and response.status_code == 200:
            messages = response.json()
            is_list = isinstance(messages, list)
            
            # Look for notification about found similar item
            found_notification = None
            for msg in messages:
                if (msg.get('notification_type') == 'found_similar' and 
                    msg.get('related_found_item_id') == self.raju_found_item_id):
                    found_notification = msg
                    break
            
            if found_notification:
                has_proper_fields = all(field in found_notification for field in 
                                      ['id', 'content', 'notification_type', 'related_found_item_id'])
                correct_type = found_notification.get('notification_type') == 'found_similar'
                correct_found_item = found_notification.get('related_found_item_id') == self.raju_found_item_id
                
                success = has_proper_fields and correct_type and correct_found_item
                self.log_result("Notification Created", success,
                              f"Notification found with type: {found_notification.get('notification_type')}, Found item: {found_notification.get('related_found_item_id')}")
                self.notification_id = found_notification.get('id')
            else:
                self.log_result("Notification Created", False, 
                              f"No 'found_similar' notification found. Total messages: {len(messages)}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Notification Created", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")

    def test_get_found_similar_items(self):
        """Test 4: GET /api/items/found-similar - Get found items linked to my lost items"""
        print("\n🔗 Testing GET /api/items/found-similar...")
        
        response = self.make_request('GET', 'items/found-similar', token=self.sam_token)
        
        if response and response.status_code == 200:
            data = response.json()
            found_similar = data.get('found_similar', [])
            count = data.get('count', 0)
            
            # Check if our linked item is in the results
            our_linked_item = None
            for item in found_similar:
                if item.get('id') == self.raju_found_item_id:
                    our_linked_item = item
                    break
            
            if our_linked_item:
                # Check structure
                has_finder_info = 'finder' in our_linked_item
                has_related_lost_item = 'related_lost_item' in our_linked_item
                excludes_secret = 'secret_message' not in our_linked_item
                excludes_student_id = 'student_id' not in our_linked_item
                
                # Check finder info is safe
                finder_info = our_linked_item.get('finder', {})
                safe_finder_info = 'full_name' in finder_info and 'department' in finder_info
                
                # Check related lost item info
                related_lost = our_linked_item.get('related_lost_item', {})
                has_lost_info = 'item_keyword' in related_lost and 'description' in related_lost
                
                success = (has_finder_info and has_related_lost_item and excludes_secret and 
                          excludes_student_id and safe_finder_info and has_lost_info)
                
                self.log_result("GET Found Similar Items", success,
                              f"Found {count} similar items, Proper structure: {success}, Finder info safe: {safe_finder_info}")
            else:
                self.log_result("GET Found Similar Items", False,
                              f"Our linked item not found in results. Found {count} items total")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("GET Found Similar Items", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")

    def test_normal_found_item_creation(self):
        """Test 5: Verify normal found item creation (without related_lost_item_id) still works"""
        print("\n📦 Testing Normal FOUND Item Creation (No Linking)...")
        
        url = f"{self.base_url}/items"
        headers = {'Authorization': f'Bearer {self.raju_token}'}
        
        form_data = {
            'item_type': 'found',
            'item_keyword': 'Wallet',
            'description': 'Brown leather wallet found in cafeteria. Contains some cards.',
            'location': 'Main Cafeteria',
            'approximate_time': 'Morning',
            'secret_message': 'Wallet has a student ID card and some credit cards inside'
            # No related_lost_item_id - normal found item
        }
        
        try:
            response = requests.post(url, data=form_data, headers=headers, timeout=30)
        except Exception as e:
            self.log_result("Normal FOUND Item Creation", False, f"Request error: {str(e)}")
            return False
        
        if response and response.status_code == 200:
            data = response.json()
            item_id = data.get('item_id')
            success = 'successfully' in data.get('message', '')
            
            self.log_result("Normal FOUND Item Creation", success,
                          f"Normal Found Item ID: {item_id}")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Normal FOUND Item Creation", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
            return False

    def test_claim_creation_flow(self):
        """Test 6: Verify claim creation flow still works"""
        print("\n⚖️ Testing Claim Creation Flow...")
        
        # Create a simple found item first
        url = f"{self.base_url}/items"
        headers = {'Authorization': f'Bearer {self.sam_token}'}
        
        form_data = {
            'item_type': 'found',
            'item_keyword': 'Keys',
            'description': 'Set of keys with blue keychain found in parking lot.',
            'location': 'Main Parking Area',
            'approximate_time': 'Evening',
            'secret_message': 'Keys have a house key and car key with Toyota logo'
        }
        
        try:
            response = requests.post(url, data=form_data, headers=headers, timeout=30)
            if response.status_code != 200:
                self.log_result("Claim Creation Flow", False, "Could not create test found item for claim")
                return False
            
            found_item_id = response.json().get('item_id')
            
            # Now try to create a claim on this found item (as RAJU)
            claim_response = self.make_request('POST', 'claims', {
                "item_id": found_item_id,
                "message": "These are my keys. I lost them yesterday in the parking area."
            }, token=self.raju_token)
            
            if claim_response and claim_response.status_code == 200:
                claim_data = claim_response.json()
                claim_id = claim_data.get('claim_id')
                success = 'submitted' in claim_data.get('message', '')
                
                self.log_result("Claim Creation Flow", success,
                              f"Claim ID: {claim_id}")
                return True
            else:
                error_msg = claim_response.json().get('detail', 'Unknown error') if claim_response else 'No response'
                self.log_result("Claim Creation Flow", False,
                              f"Claim Status: {claim_response.status_code if claim_response else 'None'}, Error: {error_msg}")
                return False
                
        except Exception as e:
            self.log_result("Claim Creation Flow", False, f"Request error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all Lost & Found linking tests"""
        print("\n" + "="*80)
        print("🔗 TESTING LOST & FOUND LINKING LOGIC AND APIs")
        print("="*80)
        
        # Login all users
        if not self.login_admin():
            print("❌ Cannot proceed without admin authentication")
            return False
        
        if not self.login_sam_student():
            print("❌ Cannot proceed without Sam student authentication")
            return False
        
        if not self.login_raju_student():
            print("❌ Cannot proceed without RAJU student authentication")
            return False
        
        # Test 1: Search for matching lost items
        self.test_get_matching_lost_items()
        
        # Create test data
        if not self.create_lost_item_as_sam():
            print("❌ Cannot proceed without Sam's lost item")
            return False
        
        # Test 2: Create linked found item
        if not self.create_linked_found_item_as_raju():
            print("❌ Cannot proceed without linked found item")
            return False
        
        # Test 3: Check notification created
        self.test_notification_created()
        
        # Test 4: Get found similar items
        self.test_get_found_similar_items()
        
        # Test 5: Verify existing flows still work
        self.test_normal_found_item_creation()
        self.test_claim_creation_flow()
        
        # Print summary
        print("\n" + "="*80)
        print("📊 LOST & FOUND LINKING TEST SUMMARY")
        print("="*80)
        print(f"Tests Run: {self.tests_run}")
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
    tester = LostFoundLinkingTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)