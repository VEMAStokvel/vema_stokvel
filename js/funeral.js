import { db, auth } from './firebase.js';

// Funeral cover management functions
document.addEventListener('DOMContentLoaded', () => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    
    // Load user's funeral cover status
    function loadFuneralCover() {
        db.collection('users').doc(userId).get()
            .then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    const hasCover = userData.funeralCover || false;
                    const coverType = userData.funeralCoverType || 'none';
                    
                    // Update UI
                    const coverStatus = document.getElementById('cover-status');
                    const coverTypeElement = document.getElementById('cover-type');
                    
                    if (hasCover) {
                        coverStatus.textContent = 'Active';
                        coverStatus.classList.remove('bg-gray-200', 'text-gray-800');
                        coverStatus.classList.add('bg-green-100', 'text-green-800');
                        coverTypeElement.textContent = coverType === 'basic' ? 'Basic Plan' : 
                                                      coverType === 'family' ? 'Family Plan' : 'Extended Family Plan';
                    } else {
                        coverStatus.textContent = 'Inactive';
                        coverStatus.classList.remove('bg-green-100', 'text-green-800');
                        coverStatus.classList.add('bg-gray-200', 'text-gray-800');
                        coverTypeElement.textContent = 'No active cover';
                    }
                    
                    // Update manage button text
                    const manageBtn = document.getElementById('manage-cover-btn');
                    if (manageBtn) {
                        manageBtn.textContent = hasCover ? 'Manage Cover' : 'Get Cover';
                    }
                }
            })
            .catch(error => {
                console.error('Error loading funeral cover:', error);
            });
    }
    
    // Handle plan selection
    document.querySelectorAll('.select-plan').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const plan = button.dataset.plan;
            
            // Update modal with selected plan
            document.getElementById('plan-modal').classList.remove('hidden');
            
            let planName, planPrice;
            switch (plan) {
                case 'basic':
                    planName = 'Basic Plan';
                    planPrice = 'R99/month';
                    break;
                case 'family':
                    planName = 'Family Plan';
                    planPrice = 'R199/month';
                    break;
                case 'extended':
                    planName = 'Extended Family Plan';
                    planPrice = 'R299/month';
                    break;
            }
            
            document.getElementById('selected-plan-name').textContent = planName;
            document.getElementById('selected-plan-price').textContent = planPrice;
            
            // Store selected plan in form
            const planForm = document.getElementById('plan-form');
            planForm.dataset.plan = plan;
        });
    });
    
    // Close plan modal
    const closePlanModal = document.getElementById('close-plan-modal');
    if (closePlanModal) {
        closePlanModal.addEventListener('click', () => {
            document.getElementById('plan-modal').classList.add('hidden');
        });
    }
    
    const cancelPlan = document.getElementById('cancel-plan');
    if (cancelPlan) {
        cancelPlan.addEventListener('click', () => {
            document.getElementById('plan-modal').classList.add('hidden');
        });
    }
    
    // Handle plan form submission
    const planForm = document.getElementById('plan-form');
    if (planForm) {
        planForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const plan = planForm.dataset.plan;
            const paymentMethod = document.getElementById('payment-method').value;
            
            if (!plan || !paymentMethod) {
                alert('Please select a plan and payment method');
                return;
            }
            
            // For Basic plan, just save it
            if (plan === 'basic') {
                db.collection('users').doc(userId).update({
                    funeralCover: true,
                    funeralCoverType: plan,
                    funeralCoverSince: new Date().toISOString(),
                    funeralCoverPaymentMethod: paymentMethod
                })
                .then(() => {
                    alert('Funeral cover activated successfully!');
                    document.getElementById('plan-modal').classList.add('hidden');
                    loadFuneralCover();
                    
                    // Check if user qualifies for higher discount
                    db.collection('users').doc(userId).get()
                        .then(userDoc => {
                            if (userDoc.exists) {
                                const userData = userDoc.data();
                                const savingsTotal = userData.savingsTotal || 0;
                                let storeDiscount = userData.storeDiscount || 0;
                                
                                if (savingsTotal >= 10000 && storeDiscount < 25) {
                                    storeDiscount = 25;
                                } else if (savingsTotal >= 5000 && storeDiscount < 10) {
                                    storeDiscount = 10;
                                }
                                
                                if (storeDiscount !== userData.storeDiscount) {
                                    return db.collection('users').doc(userId).update({
                                        storeDiscount: storeDiscount
                                    });
                                }
                            }
                        });
                })
                .catch(error => {
                    console.error('Error activating funeral cover:', error);
                    alert('Error activating cover: ' + error.message);
                });
            } else {
                // For family plans, show family details form
                document.getElementById('plan-modal').classList.add('hidden');
                document.getElementById('family-modal').classList.remove('hidden');
            }
        });
    }
    
    // Handle family details form
    const hasSpouse = document.getElementById('has-spouse');
    if (hasSpouse) {
        hasSpouse.addEventListener('change', (e) => {
            document.getElementById('spouse-fields').classList.toggle('hidden', !e.target.checked);
        });
    }
    
    // Add child fields
    const addChild = document.getElementById('add-child');
    if (addChild) {
        addChild.addEventListener('click', () => {
            const childrenFields = document.getElementById('children-fields');
            const childCount = childrenFields.querySelectorAll('.child-field').length + 1;
            
            if (childCount > 4) {
                alert('Maximum of 4 children allowed');
                return;
            }
            
            const childField = document.createElement('div');
            childField.className = 'child-field grid md:grid-cols-2 gap-4';
            childField.innerHTML = `
                <div>
                    <label class="block text-gray-700 text-sm mb-2">Child ${childCount} Name</label>
                    <input type="text" class="w-full p-2 border rounded" placeholder="Child name">
                </div>
                <div>
                    <label class="block text-gray-700 text-sm mb-2">Child ${childCount} ID/Birth Certificate</label>
                    <input type="text" class="w-full p-2 border rounded" placeholder="ID/Birth certificate number">
                </div>
            `;
            childrenFields.appendChild(childField);
        });
    }
    
    // Add parent fields
    const addParent = document.getElementById('add-parent');
    if (addParent) {
        addParent.addEventListener('click', () => {
            const parentsFields = document.getElementById('parents-fields');
            const parentCount = parentsFields.querySelectorAll('.parent-field').length + 1;
            
            if (parentCount > 2) {
                alert('Maximum of 2 parents allowed');
                return;
            }
            
            const parentField = document.createElement('div');
            parentField.className = 'parent-field grid md:grid-cols-2 gap-4';
            parentField.innerHTML = `
                <div>
                    <label class="block text-gray-700 text-sm mb-2">Parent ${parentCount} Name</label>
                    <input type="text" class="w-full p-2 border rounded" placeholder="Parent name">
                </div>
                <div>
                    <label class="block text-gray-700 text-sm mb-2">Parent ${parentCount} ID Number</label>
                    <input type="text" class="w-full p-2 border rounded" placeholder="ID number">
                </div>
            `;
            parentsFields.appendChild(parentField);
        });
    }
    
    // Close family modal
    const closeFamilyModal = document.getElementById('close-family-modal');
    if (closeFamilyModal) {
        closeFamilyModal.addEventListener('click', () => {
            document.getElementById('family-modal').classList.add('hidden');
        });
    }
    
    const cancelFamily = document.getElementById('cancel-family');
    if (cancelFamily) {
        cancelFamily.addEventListener('click', () => {
            document.getElementById('family-modal').classList.add('hidden');
        });
    }
    
    // Handle family form submission
    const familyForm = document.getElementById('family-form');
    if (familyForm) {
        familyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const plan = document.getElementById('plan-form').dataset.plan;
            const paymentMethod = document.getElementById('payment-method').value;
            
            // Collect family data
            const familyData = {
                mainMember: {
                    name: familyForm.querySelector('input[type="text"]').value,
                    id: familyForm.querySelector('input[placeholder="Enter ID number"]').value
                },
                spouse: null,
                children: [],
                parents: []
            };
            
            if (document.getElementById('has-spouse').checked) {
                familyData.spouse = {
                    name: familyForm.querySelector('input[placeholder="Spouse name"]').value,
                    id: familyForm.querySelector('input[placeholder="Spouse ID number"]').value
                };
            }
            
            document.querySelectorAll('.child-field').forEach((field, index) => {
                const inputs = field.querySelectorAll('input');
                familyData.children.push({
                    name: inputs[0].value,
                    id: inputs[1].value
                });
            });
            
            document.querySelectorAll('.parent-field').forEach((field, index) => {
                const inputs = field.querySelectorAll('input');
                familyData.parents.push({
                    name: inputs[0].value,
                    id: inputs[1].value
                });
            });
            
            // Save to Firestore
            db.collection('users').doc(userId).update({
                funeralCover: true,
                funeralCoverType: plan,
                funeralCoverSince: new Date().toISOString(),
                funeralCoverPaymentMethod: paymentMethod,
                funeralFamilyDetails: familyData
            })
            .then(() => {
                alert('Family funeral cover activated successfully!');
                document.getElementById('family-modal').classList.add('hidden');
                loadFuneralCover();
                
                // Check if user qualifies for higher discount
                db.collection('users').doc(userId).get()
                    .then(userDoc => {
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            const savingsTotal = userData.savingsTotal || 0;
                            let storeDiscount = userData.storeDiscount || 0;
                            
                            if (savingsTotal >= 10000 && storeDiscount < 25) {
                                storeDiscount = 25;
                            } else if (savingsTotal >= 5000 && storeDiscount < 10) {
                                storeDiscount = 10;
                            }
                            
                            if (storeDiscount !== userData.storeDiscount) {
                                return db.collection('users').doc(userId).update({
                                    storeDiscount: storeDiscount
                                });
                            }
                        }
                    });
            })
            .catch(error => {
                console.error('Error activating family funeral cover:', error);
                alert('Error activating cover: ' + error.message);
            });
        });
    }
    
    // Initial load
    loadFuneralCover();
});