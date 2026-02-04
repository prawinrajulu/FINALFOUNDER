#!/usr/bin/env python3
"""
Focused AI Claim Verification System Test
Tests the comprehensive audit fixes for the AI claim verification system.
"""

import requests
import sys
import json
from datetime import datetime

class AIVerificationTester:
    def __init__(self, base_url="https://git-inspector-12.preview.emergentagent.com/api"):
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

    def test_ai_claim_vague_description(self):
        """Test AI claim with vague description - should get LOW or INSUFFICIENT confidence"""
        print("🤖 Testing AI Claim with Vague Description (Should get LOW/INSUFFICIENT)...")
        
        if not self.detailed_found_item_id:
            self.log_result("AI Claim Vague Description", False, "No detailed FOUND item ID available")
            return
        
        url = f"{self.base_url}/claims/ai-powered"
        headers = {'Authorization': f'Bearer {self.raju_token}'}
        
        form_data = {
            'item_id': self.detailed_found_item_id,
            'product_type': 'phone',  # Very generic
            'description': 'black phone',  # Very short and vague
            'identification_marks': 'black case',  # Generic
            'lost_location': 'campus',  # Vague location
            'approximate_date': 'yesterday'
        }
        
        try:
            response = requests.post(url, data=form_data, headers=headers, timeout=60)
        except Exception as e:
            self.log_result("AI Claim Vague Description", False, f"Request error: {str(e)}")
            return
        
        if response and response.status_code == 200:
            data = response.json()
            ai_analysis = data.get('ai_analysis', {})
            confidence_band = ai_analysis.get('confidence_band', '')
            
            # Should be LOW or INSUFFICIENT due to vague input
            is_low_confidence = confidence_band in ['LOW', 'INSUFFICIENT']
            has_quality_flags = len(ai_analysis.get('input_quality_flags', [])) > 0
            
            success = is_low_confidence and has_quality_flags
            self.log_result("AI Claim Vague Description", success,
                          f"Confidence: {confidence_band}, Quality flags: {len(ai_analysis.get('input_quality_flags', []))}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("AI Claim Vague Description", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")

    def test_ai_claim_detailed_description(self):
        """Test AI claim with detailed description - should get better confidence"""
        print("🤖 Testing AI Claim with Detailed Description...")
        
        if not self.detailed_found_item_id:
            self.log_result("AI Claim Detailed Description", False, "No detailed FOUND item ID available")
            return
        
        url = f"{self.base_url}/claims/ai-powered"
        headers = {'Authorization': f'Bearer {self.raju_token}'}
        
        form_data = {
            'item_id': self.detailed_found_item_id,
            'product_type': 'iPhone 13',  # Specific
            'description': 'Black iPhone 13 with cracked screen protector and scratch on back. Phone is in good working condition.',  # Detailed
            'identification_marks': 'Red silicone case with cat sticker, small dent on corner, sunset beach wallpaper',  # Very specific
            'lost_location': 'Library 2nd Floor Study Area',  # Specific location
            'approximate_date': 'Yesterday afternoon around 2 PM'
        }
        
        try:
            response = requests.post(url, data=form_data, headers=headers, timeout=60)
        except Exception as e:
            self.log_result("AI Claim Detailed Description", False, f"Request error: {str(e)}")
            return
        
        if response and response.status_code == 200:
            data = response.json()
            ai_analysis = data.get('ai_analysis', {})
            confidence_band = ai_analysis.get('confidence_band', '')
            
            # Should have structured analysis
            has_what_matched = 'what_matched' in ai_analysis
            has_what_not_matched = 'what_did_not_match' in ai_analysis
            has_missing_info = 'missing_information' in ai_analysis
            has_recommendation = 'recommendation_for_admin' in ai_analysis
            has_advisory_note = 'advisory_note' in ai_analysis
            
            success = all([has_what_matched, has_what_not_matched, has_missing_info, 
                          has_recommendation, has_advisory_note])
            
            self.log_result("AI Claim Detailed Description", success,
                          f"Confidence: {confidence_band}, Has structured analysis: {success}")
            
            # Store claim ID for further testing
            self.test_ai_claim_id = data.get('claim_id')
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("AI Claim Detailed Description", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
            return False

    def test_ai_structured_response(self):
        """Test that AI returns structured analysis with required fields"""
        print("🔍 Testing AI Structured Response Fields...")
        
        if not self.test_ai_claim_id:
            self.log_result("AI Structured Response", False, "No AI claim ID available")
            return
        
        # Get the claim details to verify AI analysis structure
        response = self.make_request('GET', f'claims/{self.test_ai_claim_id}', token=self.admin_token)
        
        if response and response.status_code == 200:
            claim_data = response.json()
            ai_analysis = claim_data.get('ai_analysis', {})
            
            # Check for all required fields
            required_fields = [
                'confidence_band',
                'what_matched',
                'what_did_not_match', 
                'missing_information',
                'recommendation_for_admin',
                'advisory_note'
            ]
            
            missing_fields = [field for field in required_fields if field not in ai_analysis]
            has_all_fields = len(missing_fields) == 0
            
            # Check confidence band is valid
            valid_bands = ['INSUFFICIENT', 'LOW', 'MEDIUM', 'HIGH']
            valid_confidence = ai_analysis.get('confidence_band') in valid_bands
            
            # Check arrays are actually arrays
            arrays_valid = (
                isinstance(ai_analysis.get('what_matched', []), list) and
                isinstance(ai_analysis.get('what_did_not_match', []), list) and
                isinstance(ai_analysis.get('missing_information', []), list)
            )
            
            success = has_all_fields and valid_confidence and arrays_valid
            self.log_result("AI Structured Response", success,
                          f"Missing fields: {missing_fields}, Valid confidence: {valid_confidence}, Arrays valid: {arrays_valid}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("AI Structured Response", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")

    def test_insufficient_confidence_band(self):
        """Test that INSUFFICIENT confidence band exists and is used for weak evidence"""
        print("⚠️ Testing INSUFFICIENT Confidence Band...")
        
        if not self.detailed_found_item_id:
            self.log_result("AI INSUFFICIENT Band", False, "No detailed FOUND item ID available")
            return
        
        url = f"{self.base_url}/claims/ai-powered"
        headers = {'Authorization': f'Bearer {self.raju_token}'}
        
        form_data = {
            'item_id': self.detailed_found_item_id,
            'product_type': 'thing',  # Extremely vague
            'description': 'my stuff that I lost somewhere',  # Minimal description
            'identification_marks': 'normal looking item',  # No real identification
            'lost_location': 'somewhere on campus',  # Vague location
            'approximate_date': 'sometime this week'  # Vague time
        }
        
        try:
            response = requests.post(url, data=form_data, headers=headers, timeout=60)
        except Exception as e:
            self.log_result("AI INSUFFICIENT Band", False, f"Request error: {str(e)}")
            return
        
        if response and response.status_code == 200:
            data = response.json()
            ai_analysis = data.get('ai_analysis', {})
            confidence_band = ai_analysis.get('confidence_band', '')
            
            # Should be INSUFFICIENT due to extremely vague input
            is_insufficient = confidence_band == 'INSUFFICIENT'
            has_missing_info = len(ai_analysis.get('missing_information', [])) > 0
            
            success = is_insufficient and has_missing_info
            self.log_result("AI INSUFFICIENT Band", success,
                          f"Confidence: {confidence_band}, Missing info count: {len(ai_analysis.get('missing_information', []))}")
        else:
            # If it fails due to validation (too short description), that's also correct behavior
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            validation_error = 'too vague' in error_msg.lower() or 'minimum' in error_msg.lower()
            self.log_result("AI INSUFFICIENT Band", validation_error,
                          f"Input validation rejected vague description: {error_msg}")

    def test_input_quality_assessment(self):
        """Test that input quality assessment penalizes vague descriptions"""
        print("📝 Testing Input Quality Assessment...")
        
        if not self.detailed_found_item_id:
            self.log_result("Input Quality Assessment", False, "No detailed FOUND item ID available")
            return
        
        url = f"{self.base_url}/claims/ai-powered"
        headers = {'Authorization': f'Bearer {self.raju_token}'}
        
        form_data = {
            'item_id': self.detailed_found_item_id,
            'product_type': 'phone',  # Generic term
            'description': 'black phone small device',  # Short with only generic terms
            'identification_marks': 'black case normal size',  # Generic marks
            'lost_location': 'library somewhere',  # Generic location
            'approximate_date': 'yesterday'
        }
        
        try:
            response = requests.post(url, data=form_data, headers=headers, timeout=60)
        except Exception as e:
            self.log_result("Input Quality Assessment", False, f"Request error: {str(e)}")
            return
        
        if response and response.status_code == 200:
            data = response.json()
            ai_analysis = data.get('ai_analysis', {})
            
            # Should have quality flags for generic/vague input
            quality_flags = ai_analysis.get('input_quality_flags', [])
            has_quality_flags = len(quality_flags) > 0
            
            # Check for specific quality issues
            has_generic_flag = any('generic' in flag.lower() for flag in quality_flags)
            has_short_flag = any('short' in flag.lower() for flag in quality_flags)
            
            success = has_quality_flags and (has_generic_flag or has_short_flag)
            self.log_result("Input Quality Assessment", success,
                          f"Quality flags: {len(quality_flags)}, Flags: {quality_flags}")
        else:
            # If validation rejects it, that's also correct
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            validation_error = 'vague' in error_msg.lower() or 'minimum' in error_msg.lower()
            self.log_result("Input Quality Assessment", validation_error,
                          f"Pre-validation caught vague input: {error_msg}")

    def test_ai_advisory_only(self):
        """Test that AI is truly advisory - no status changes by AI"""
        print("⚖️ Testing AI is Advisory Only (No Status Changes)...")
        
        if not self.test_ai_claim_id:
            self.log_result("AI Advisory Only", False, "No AI claim ID available")
            return
        
        # Get the claim to check its status
        response = self.make_request('GET', f'claims/{self.test_ai_claim_id}', token=self.admin_token)
        
        if response and response.status_code == 200:
            claim_data = response.json()
            claim_status = claim_data.get('status', '')
            ai_analysis = claim_data.get('ai_analysis', {})
            
            # Claim should still be 'pending' - AI doesn't change status
            is_still_pending = claim_status == 'pending'
            has_advisory_note = 'advisory_note' in ai_analysis
            advisory_mentions_admin = 'admin' in ai_analysis.get('advisory_note', '').lower()
            
            success = is_still_pending and has_advisory_note and advisory_mentions_admin
            self.log_result("AI Advisory Only", success,
                          f"Status: {claim_status}, Has advisory note: {has_advisory_note}, Mentions admin: {advisory_mentions_admin}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("AI Advisory Only", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")

    def run_all_tests(self):
        """Run all AI verification tests"""
        print("🚀 Starting AI Claim Verification System Tests...")
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
        print("🤖 TESTING AI CLAIM VERIFICATION AUDIT FIXES")
        print("="*70)
        
        # Run AI verification tests
        self.test_ai_claim_vague_description()
        self.test_ai_claim_detailed_description()
        self.test_ai_structured_response()
        self.test_insufficient_confidence_band()
        self.test_input_quality_assessment()
        self.test_ai_advisory_only()
        
        # Print Summary
        print(f"\n📊 AI VERIFICATION TEST SUMMARY")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
        else:
            print(f"\n🎉 ALL AI VERIFICATION TESTS PASSED!")
        
        return self.tests_passed == self.tests_run

def main():
    tester = AIVerificationTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())