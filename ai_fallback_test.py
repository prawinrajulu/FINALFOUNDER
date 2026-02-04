#!/usr/bin/env python3
"""
AI Verification System Test - Testing Fallback Behavior and Structure
Tests the AI claim verification system focusing on the audit fixes that don't require LLM integration.
"""

import requests
import sys
import json
from datetime import datetime

class AIFallbackTester:
    def __init__(self, base_url="https://codecheck-24.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.sam_token = None
        self.raju_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.detailed_found_item_id = None
        self.test_ai_claim_id = None

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
        print("🔐 Logging in as Admin...")
        
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
        print("👨‍🎓 Logging in as Sam (Student 1)...")
        
        response = self.make_request('POST', 'auth/student/login', {
            "roll_number": "112723205028",
            "dob": "17-04-2006"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.sam_token = data.get('token')
            self.log_result("Sam Student Login", True, "Logged in as Sam")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Sam Student Login", False, f"Error: {error_msg}")
            return False

    def login_raju_student(self):
        """Login as RAJU student (112723205047 / 23-04-2006)"""
        print("👨‍🎓 Logging in as RAJU (Student 2)...")
        
        response = self.make_request('POST', 'auth/student/login', {
            "roll_number": "112723205047",
            "dob": "23-04-2006"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.raju_token = data.get('token')
            self.log_result("RAJU Student Login", True, "Logged in as RAJU")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("RAJU Student Login", False, f"Error: {error_msg}")
            return False

    def create_detailed_found_item_as_sam(self):
        """Create a FOUND item as Sam with detailed description and secret message"""
        print("📱 Creating Detailed FOUND Item as Sam...")
        
        url = f"{self.base_url}/items"
        headers = {'Authorization': f'Bearer {self.sam_token}'}
        
        form_data = {
            'item_type': 'found',
            'item_keyword': 'iPhone 13',
            'description': 'Black iPhone 13 with cracked screen protector and scratch on back. Phone is in good working condition.',
            'location': 'Library 2nd Floor Study Area',
            'approximate_time': 'Afternoon',
            'secret_message': 'Phone has a red silicone case with a small cat sticker on the back. There is a small dent on the bottom right corner of the case. The lock screen wallpaper shows a sunset beach scene.'
        }
        
        try:
            response = requests.post(url, data=form_data, headers=headers)
        except Exception as e:
            self.log_result("Create Detailed FOUND Item", False, f"Request error: {str(e)}")
            return False
        
        if response and response.status_code == 200:
            data = response.json()
            self.detailed_found_item_id = data.get('item_id')
            success = 'successfully' in data.get('message', '')
            
            self.log_result("Create Detailed FOUND Item", success,
                          f"Item ID: {self.detailed_found_item_id}")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Create Detailed FOUND Item", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
            return False

    def test_input_validation_vague_description(self):
        """Test that vague descriptions are rejected by input validation"""
        print("📝 Testing Input Validation - Vague Description Rejection...")
        
        if not self.detailed_found_item_id:
            self.log_result("Input Validation Vague", False, "No detailed FOUND item ID available")
            return
        
        url = f"{self.base_url}/claims/ai-powered"
        headers = {'Authorization': f'Bearer {self.raju_token}'}
        
        # Test with description that's too short (should be rejected)
        form_data = {
            'item_id': self.detailed_found_item_id,
            'product_type': 'phone',
            'description': 'black phone',  # Too short - should be rejected
            'identification_marks': 'case',  # Too short - should be rejected
            'lost_location': 'campus',
            'approximate_date': 'yesterday'
        }
        
        try:
            response = requests.post(url, data=form_data, headers=headers, timeout=30)
        except Exception as e:
            self.log_result("Input Validation Vague", False, f"Request error: {str(e)}")
            return
        
        # Should get 400 Bad Request due to validation
        if response and response.status_code == 400:
            error_msg = response.json().get('detail', '')
            validation_error = ('vague' in error_msg.lower() or 
                              'minimum' in error_msg.lower() or
                              'characters' in error_msg.lower())
            
            self.log_result("Input Validation Vague", validation_error,
                          f"Validation error: {error_msg}")
        else:
            self.log_result("Input Validation Vague", False,
                          f"Expected 400 validation error, got: {response.status_code if response else 'None'}")

    def test_ai_fallback_structure(self):
        """Test AI fallback returns proper structure when LLM is unavailable"""
        print("🤖 Testing AI Fallback Structure (No LLM)...")
        
        if not self.detailed_found_item_id:
            self.log_result("AI Fallback Structure", False, "No detailed FOUND item ID available")
            return
        
        url = f"{self.base_url}/claims/ai-powered"
        headers = {'Authorization': f'Bearer {self.raju_token}'}
        
        # Use valid input that passes validation
        form_data = {
            'item_id': self.detailed_found_item_id,
            'product_type': 'iPhone 13 Pro Max',
            'description': 'Black iPhone 13 Pro Max with cracked screen protector and visible scratch on the back cover near camera',
            'identification_marks': 'Red silicone case with small cat sticker on back, small dent on bottom right corner',
            'lost_location': 'Library 2nd Floor Study Area near the windows',
            'approximate_date': 'Yesterday afternoon around 2:30 PM'
        }
        
        try:
            response = requests.post(url, data=form_data, headers=headers, timeout=30)
        except Exception as e:
            self.log_result("AI Fallback Structure", False, f"Request error: {str(e)}")
            return
        
        if response and response.status_code == 200:
            data = response.json()
            ai_analysis = data.get('ai_analysis', {})
            
            # Check for required fallback structure
            required_fields = [
                'confidence_band',
                'what_matched',
                'what_did_not_match',
                'missing_information',
                'advisory_note'
            ]
            
            missing_fields = [field for field in required_fields if field not in ai_analysis]
            has_all_required = len(missing_fields) == 0
            
            # Check confidence band is INSUFFICIENT (fallback behavior)
            is_insufficient = ai_analysis.get('confidence_band') == 'INSUFFICIENT'
            
            # Check arrays are lists
            arrays_valid = (
                isinstance(ai_analysis.get('what_matched', []), list) and
                isinstance(ai_analysis.get('what_did_not_match', []), list) and
                isinstance(ai_analysis.get('missing_information', []), list)
            )
            
            # Check advisory note mentions manual review
            advisory_note = ai_analysis.get('advisory_note', '')
            mentions_manual = 'manual' in advisory_note.lower() or 'admin' in advisory_note.lower()
            
            success = has_all_required and is_insufficient and arrays_valid and mentions_manual
            self.log_result("AI Fallback Structure", success,
                          f"Missing fields: {missing_fields}, INSUFFICIENT: {is_insufficient}, Arrays valid: {arrays_valid}, Mentions manual: {mentions_manual}")
            
            # Store claim ID for further testing
            self.test_ai_claim_id = data.get('claim_id')
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("AI Fallback Structure", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
            return False

    def test_insufficient_confidence_band_exists(self):
        """Test that INSUFFICIENT confidence band exists in the system"""
        print("⚠️ Testing INSUFFICIENT Confidence Band Exists...")
        
        if not self.test_ai_claim_id:
            self.log_result("INSUFFICIENT Band Exists", False, "No AI claim ID available")
            return
        
        # Get the claim to verify INSUFFICIENT band is used
        response = self.make_request('GET', f'claims/{self.test_ai_claim_id}', token=self.admin_token)
        
        if response and response.status_code == 200:
            claim_data = response.json()
            ai_analysis = claim_data.get('ai_analysis', {})
            confidence_band = ai_analysis.get('confidence_band', '')
            
            # Should be INSUFFICIENT when LLM is not available
            is_insufficient = confidence_band == 'INSUFFICIENT'
            has_reasoning = 'reasoning' in ai_analysis
            reasoning_mentions_unavailable = 'not available' in ai_analysis.get('reasoning', '').lower()
            
            success = is_insufficient and has_reasoning and reasoning_mentions_unavailable
            self.log_result("INSUFFICIENT Band Exists", success,
                          f"Confidence: {confidence_band}, Has reasoning: {has_reasoning}, Mentions unavailable: {reasoning_mentions_unavailable}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("INSUFFICIENT Band Exists", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")

    def test_ai_advisory_only_no_status_change(self):
        """Test that AI doesn't change claim status - remains advisory only"""
        print("⚖️ Testing AI Advisory Only - No Status Changes...")
        
        if not self.test_ai_claim_id:
            self.log_result("AI Advisory Only", False, "No AI claim ID available")
            return
        
        # Get the claim to check its status hasn't changed
        response = self.make_request('GET', f'claims/{self.test_ai_claim_id}', token=self.admin_token)
        
        if response and response.status_code == 200:
            claim_data = response.json()
            claim_status = claim_data.get('status', '')
            ai_analysis = claim_data.get('ai_analysis', {})
            
            # Claim should still be 'pending' - AI doesn't change status
            is_still_pending = claim_status == 'pending'
            has_advisory_note = 'advisory_note' in ai_analysis
            advisory_note = ai_analysis.get('advisory_note', '')
            mentions_advisory = 'advisory' in advisory_note.lower()
            mentions_admin_review = 'admin' in advisory_note.lower()
            
            success = is_still_pending and has_advisory_note and mentions_advisory and mentions_admin_review
            self.log_result("AI Advisory Only", success,
                          f"Status: {claim_status}, Advisory note: {mentions_advisory}, Admin review: {mentions_admin_review}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("AI Advisory Only", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")

    def test_claims_only_for_found_items(self):
        """Test that AI claims are only allowed for FOUND items"""
        print("🔍 Testing Claims Only for FOUND Items...")
        
        # First create a LOST item
        url = f"{self.base_url}/items"
        headers = {'Authorization': f'Bearer {self.sam_token}'}
        
        lost_form_data = {
            'item_type': 'lost',
            'item_keyword': 'Wallet',
            'description': 'Brown leather wallet with university ID inside',
            'location': 'Cafeteria',
            'approximate_time': 'Morning',
            'secret_message': 'Wallet has my student ID and a photo of my family'
        }
        
        try:
            lost_response = requests.post(url, data=lost_form_data, headers=headers)
            if lost_response.status_code != 200:
                self.log_result("Claims Only FOUND Items", False, "Could not create LOST item")
                return
            
            lost_item_id = lost_response.json().get('item_id')
            
            # Try to make AI claim on LOST item (should fail)
            ai_url = f"{self.base_url}/claims/ai-powered"
            ai_headers = {'Authorization': f'Bearer {self.raju_token}'}
            
            ai_form_data = {
                'item_id': lost_item_id,
                'product_type': 'Leather Wallet',
                'description': 'Brown leather wallet with cards inside',
                'identification_marks': 'University student ID visible',
                'lost_location': 'Cafeteria area',
                'approximate_date': 'This morning'
            }
            
            ai_response = requests.post(ai_url, data=ai_form_data, headers=ai_headers)
            
            # Should get 400 Bad Request with semantic error
            if ai_response and ai_response.status_code == 400:
                error_msg = ai_response.json().get('detail', '')
                semantic_error = ('only for FOUND items' in error_msg or 
                                'Use \'I Found This\'' in error_msg)
                
                self.log_result("Claims Only FOUND Items", semantic_error,
                              f"Semantic error: {error_msg}")
            else:
                self.log_result("Claims Only FOUND Items", False,
                              f"Expected 400 semantic error, got: {ai_response.status_code if ai_response else 'None'}")
                
        except Exception as e:
            self.log_result("Claims Only FOUND Items", False, f"Request error: {str(e)}")

    def test_input_quality_flags_present(self):
        """Test that input quality flags are present in AI analysis"""
        print("🏷️ Testing Input Quality Flags Present...")
        
        if not self.test_ai_claim_id:
            self.log_result("Input Quality Flags", False, "No AI claim ID available")
            return
        
        # Get the claim to check input quality flags
        response = self.make_request('GET', f'claims/{self.test_ai_claim_id}', token=self.admin_token)
        
        if response and response.status_code == 200:
            claim_data = response.json()
            ai_analysis = claim_data.get('ai_analysis', {})
            
            # Check for input quality flags field
            has_quality_flags = 'input_quality_flags' in ai_analysis
            quality_flags = ai_analysis.get('input_quality_flags', [])
            is_list = isinstance(quality_flags, list)
            
            success = has_quality_flags and is_list
            self.log_result("Input Quality Flags", success,
                          f"Has quality flags: {has_quality_flags}, Is list: {is_list}, Count: {len(quality_flags)}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Input Quality Flags", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")

    def run_all_tests(self):
        """Run all AI verification fallback tests"""
        print("🚀 Starting AI Claim Verification Fallback Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        print("="*70)
        
        # Authentication
        if not self.login_admin():
            print("❌ Cannot proceed without admin authentication")
            return False
        
        if not self.login_sam_student():
            print("❌ Cannot proceed without Sam student authentication")
            return False
        
        if not self.login_raju_student():
            print("❌ Cannot proceed without RAJU student authentication")
            return False
        
        # Create test item
        if not self.create_detailed_found_item_as_sam():
            print("❌ Cannot proceed without test FOUND item")
            return False
        
        print("\n" + "="*70)
        print("🤖 TESTING AI VERIFICATION AUDIT FIXES (FALLBACK BEHAVIOR)")
        print("="*70)
        
        # Run AI verification tests
        self.test_input_validation_vague_description()
        self.test_ai_fallback_structure()
        self.test_insufficient_confidence_band_exists()
        self.test_ai_advisory_only_no_status_change()
        self.test_claims_only_for_found_items()
        self.test_input_quality_flags_present()
        
        # Print Summary
        print(f"\n📊 AI VERIFICATION FALLBACK TEST SUMMARY")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
        else:
            print(f"\n🎉 ALL AI VERIFICATION FALLBACK TESTS PASSED!")
        
        return self.tests_passed == self.tests_run

def main():
    tester = AIFallbackTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())