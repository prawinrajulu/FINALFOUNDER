import requests
import json
from datetime import datetime

class QADataTester:
    def __init__(self, base_url="https://findly-analytics.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.sam_token = None
        self.raju_token = None
        self.admin_token = None
        self.test_found_item_id = None
        self.test_claim_id = None

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
            
            return response
        except Exception as e:
            print(f"Request error for {method} {endpoint}: {str(e)}")
            return None

    def login_users(self):
        """Login all required users"""
        print("🔐 Logging in users...")
        
        # Login Sam
        response = self.make_request('POST', 'auth/student/login', {
            "roll_number": "112723205028",
            "dob": "17-04-2006"
        })
        if response and response.status_code == 200:
            self.sam_token = response.json().get('token')
            print("✅ Sam logged in")
        else:
            print("❌ Sam login failed")
            return False
        
        # Login RAJU
        response = self.make_request('POST', 'auth/student/login', {
            "roll_number": "112723205047",
            "dob": "23-04-2006"
        })
        if response and response.status_code == 200:
            self.raju_token = response.json().get('token')
            print("✅ RAJU logged in")
        else:
            print("❌ RAJU login failed")
            return False
        
        # Login Admin
        response = self.make_request('POST', 'auth/admin/login', {
            "username": "superadmin",
            "password": "SuperAdmin@123"
        })
        if response and response.status_code == 200:
            self.admin_token = response.json().get('token')
            print("✅ Admin logged in")
        else:
            print("❌ Admin login failed")
            return False
        
        return True

    def create_test_found_item(self):
        """Create a found item for claim testing"""
        print("\n📦 Creating test FOUND item...")
        
        url = f"{self.base_url}/items"
        headers = {'Authorization': f'Bearer {self.sam_token}'}
        
        form_data = {
            'item_type': 'found',
            'item_keyword': 'Laptop',
            'description': 'Dell laptop found in computer lab. Has some stickers on it.',
            'location': 'Computer Lab A',
            'approximate_time': 'Morning',
            'secret_message': 'Laptop has a "Python" sticker and a small dent on the left corner'
        }
        
        try:
            response = requests.post(url, data=form_data, headers=headers, timeout=30)
        except Exception as e:
            print(f"❌ Error creating found item: {str(e)}")
            return False
        
        if response and response.status_code == 200:
            data = response.json()
            self.test_found_item_id = data.get('item_id')
            print(f"✅ Created found item: {self.test_found_item_id}")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            print(f"❌ Failed to create found item: {error_msg}")
            return False

    def test_ai_claim_with_qa_data(self):
        """Test AI claim submission with QA data"""
        print("\n🤖 Testing AI Claim with QA Data...")
        
        if not self.test_found_item_id:
            print("❌ No test found item available")
            return False
        
        # Prepare QA data
        qa_data = [
            {
                "question": "What type of laptop is this?",
                "answer": "It's a Dell laptop, silver color with a 15-inch screen"
            },
            {
                "question": "Describe any unique marks or stickers on the laptop",
                "answer": "There's a Python programming sticker on the lid and a small dent on the left corner"
            },
            {
                "question": "Where did you last use this laptop?",
                "answer": "I was working on my project in Computer Lab A yesterday morning"
            },
            {
                "question": "What's your name or initials on the laptop?",
                "answer": "My initials 'R.K.' are written on a small label inside the laptop bag"
            },
            {
                "question": "What was the last thing you were working on?",
                "answer": "I was coding a Python web application for my final project"
            },
            {
                "question": "Any other identifying features?",
                "answer": "The laptop has a specific wallpaper - a mountain landscape, and there's a small crack on the bottom case"
            }
        ]
        
        url = f"{self.base_url}/claims/ai-powered"
        headers = {'Authorization': f'Bearer {self.raju_token}'}
        
        form_data = {
            'item_id': self.test_found_item_id,
            'product_type': 'Dell Laptop',
            'description': 'Silver Dell laptop with 15-inch screen, used for programming projects',
            'identification_marks': 'Python sticker on lid, small dent on left corner, initials R.K. on label',
            'lost_location': 'Computer Lab A',
            'approximate_date': 'Yesterday morning',
            'qa_data': json.dumps(qa_data)  # Include QA data
        }
        
        try:
            response = requests.post(url, data=form_data, headers=headers, timeout=60)
        except Exception as e:
            print(f"❌ Error submitting AI claim: {str(e)}")
            return False
        
        if response and response.status_code == 200:
            data = response.json()
            self.test_claim_id = data.get('claim_id')
            print(f"✅ AI Claim submitted successfully: {self.test_claim_id}")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            print(f"❌ AI Claim failed: Status {response.status_code if response else 'None'}, Error: {error_msg}")
            return False

    def verify_qa_data_stored(self):
        """Verify QA data is properly stored in the claim"""
        print("\n🔍 Verifying QA Data Storage...")
        
        if not self.test_claim_id:
            print("❌ No test claim ID available")
            return False
        
        # Get claim details
        response = self.make_request('GET', f'claims/{self.test_claim_id}', token=self.admin_token)
        
        if response and response.status_code == 200:
            claim_data = response.json()
            
            # Check if qa_data exists
            qa_data = claim_data.get('qa_data')
            if qa_data:
                if isinstance(qa_data, str):
                    try:
                        qa_data = json.loads(qa_data)
                    except:
                        print("❌ QA data is not valid JSON")
                        return False
                
                if isinstance(qa_data, list) and len(qa_data) > 0:
                    # Check structure of QA data
                    sample_qa = qa_data[0]
                    has_question = 'question' in sample_qa
                    has_answer = 'answer' in sample_qa
                    
                    if has_question and has_answer:
                        print(f"✅ QA Data properly stored: {len(qa_data)} Q&A pairs")
                        print(f"   Sample Q: {sample_qa.get('question', '')[:50]}...")
                        print(f"   Sample A: {sample_qa.get('answer', '')[:50]}...")
                        return True
                    else:
                        print("❌ QA data structure is incorrect")
                        return False
                else:
                    print("❌ QA data is empty or not a list")
                    return False
            else:
                print("❌ No QA data found in claim")
                return False
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            print(f"❌ Failed to get claim details: {error_msg}")
            return False

    def run_qa_tests(self):
        """Run QA data tests"""
        print("\n" + "="*60)
        print("📝 TESTING QA DATA STORAGE IN CLAIMS")
        print("="*60)
        
        if not self.login_users():
            print("❌ Failed to login users")
            return False
        
        if not self.create_test_found_item():
            print("❌ Failed to create test item")
            return False
        
        if not self.test_ai_claim_with_qa_data():
            print("❌ Failed to submit AI claim")
            return False
        
        if not self.verify_qa_data_stored():
            print("❌ QA data verification failed")
            return False
        
        print("\n🎉 All QA data tests passed!")
        return True

if __name__ == "__main__":
    tester = QADataTester()
    success = tester.run_qa_tests()