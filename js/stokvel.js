import { db, auth } from './firebase.js';

// Stokvel management functions
document.addEventListener('DOMContentLoaded', () => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    
    // Load user's stokvels
    function loadUserStokvels() {
        db.collection('users').doc(userId).get()
            .then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    const stokvels = userData.stokvels || [];
                    
                    // Update dashboard stats
                    if (document.getElementById('total-savings')) {
                        document.getElementById('total-savings').textContent = 
                            `R${userData.savingsTotal?.toLocaleString('en-ZA') || '0.00'}`;
                    }
                    
                    if (document.getElementById('active-stokvels')) {
                        document.getElementById('active-stokvels').textContent = stokvels.length;
                    }
                    
                    if (document.getElementById('store-discount')) {
                        document.getElementById('store-discount').textContent = 
                            userData.storeDiscount ? `${userData.storeDiscount}%` : '0%';
                    }
                    
                    // Populate stokvels table
                    const stokvelsBody = document.getElementById('stokvels-body');
                    if (stokvelsBody) {
                        stokvelsBody.innerHTML = '';
                        
                        if (stokvels.length === 0) {
                            stokvelsBody.innerHTML = `
                                <tr>
                                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                                        You haven't joined any stokvels yet.
                                    </td>
                                </tr>
                            `;
                            return;
                        }
                        
                        stokvels.forEach(stokvel => {
                            const row = document.createElement('tr');
                            row.className = 'hover:bg-gray-50 cursor-pointer';
                            row.dataset.id = stokvel.id;
                            row.innerHTML = `
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="font-medium">${stokvel.name}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div>${stokvel.type}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="font-bold">R${stokvel.balance?.toLocaleString('en-ZA') || '0.00'}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div>${stokvel.nextContributionDate || 'N/A'}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 py-1 text-xs rounded-full ${stokvel.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                        ${stokvel.status || 'pending'}
                                    </span>
                                </td>
                            `;
                            
                            if (document.getElementById('stokvels-table').querySelector('th:nth-child(6)')) {
                                row.innerHTML += `
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <a href="#" class="text-blue-600 hover:text-blue-900 view-stokvel">View</a>
                                    </td>
                                `;
                            }
                            
                            stokvelsBody.appendChild(row);
                            
                            // Add click event to view stokvel details
                            row.addEventListener('click', () => viewStokvelDetails(stokvel.id));
                        });
                    }
                    
                    // Populate contribution form dropdown
                    const contributionStokvel = document.getElementById('contribution-stokvel');
                    if (contributionStokvel) {
                        contributionStokvel.innerHTML = '<option value="">Select a stokvel</option>';
                        stokvels.forEach(stokvel => {
                            if (stokvel.status === 'active') {
                                const option = document.createElement('option');
                                option.value = stokvel.id;
                                option.textContent = stokvel.name;
                                contributionStokvel.appendChild(option);
                            }
                        });
                    }
                }
            })
            .catch(error => {
                console.error('Error loading stokvels:', error);
            });
    }
    
    // View stokvel details
    function viewStokvelDetails(stokvelId) {
        db.collection('stokvels').doc(stokvelId).get()
            .then(doc => {
                if (doc.exists) {
                    const stokvelData = doc.data();
                    
                    // Update UI with stokvel details
                    document.getElementById('stokvel-details').classList.remove('hidden');
                    document.getElementById('stokvel-details-title').textContent = stokvelData.name;
                    
                    // Basic info
                    document.getElementById('detail-name').textContent = stokvelData.name;
                    document.getElementById('detail-type').textContent = stokvelData.type;
                    document.getElementById('detail-manager').textContent = stokvelData.manager || 'Not assigned';
                    
                    // Format dates
                    const startDate = stokvelData.startDate ? new Date(stokvelData.startDate).toLocaleDateString('en-ZA') : 'Not set';
                    const endDate = stokvelData.endDate ? new Date(stokvelData.endDate).toLocaleDateString('en-ZA') : 'Not set';
                    
                    document.getElementById('detail-start').textContent = startDate;
                    document.getElementById('detail-end').textContent = endDate;
                    
                    // Contribution info (from user's stokvels array)
                    db.collection('users').doc(userId).get()
                        .then(userDoc => {
                            if (userDoc.exists) {
                                const userData = userDoc.data();
                                const userStokvel = userData.stokvels.find(s => s.id === stokvelId);
                                
                                if (userStokvel) {
                                    document.getElementById('detail-balance').textContent = 
                                        `R${userStokvel.balance?.toLocaleString('en-ZA') || '0.00'}`;
                                    document.getElementById('detail-monthly').textContent = 
                                        `R${userStokvel.monthlyContribution?.toLocaleString('en-ZA') || '0.00'}`;
                                    document.getElementById('detail-next-date').textContent = 
                                        userStokvel.nextContributionDate || 'Not set';
                                    document.getElementById('detail-count').textContent = 
                                        `${userStokvel.contributionsCount || 0}/${stokvelData.durationMonths || '?'}`;
                                    document.getElementById('detail-payout').textContent = 
                                        `R${userStokvel.projectedPayout?.toLocaleString('en-ZA') || '0.00'}`;
                                    
                                    // Show withdraw button only for Planning Ahead stokvel
                                    if (stokvelData.type === 'Planning Ahead') {
                                        document.getElementById('withdraw-stokvel').classList.remove('hidden');
                                    }
                                    
                                    // Load contribution history
                                    loadContributionHistory(stokvelId);
                                }
                            }
                        });
                    
                    // Scroll to details section
                    document.getElementById('stokvel-details').scrollIntoView({ behavior: 'smooth' });
                }
            })
            .catch(error => {
                console.error('Error loading stokvel details:', error);
            });
    }
    
    // Load contribution history
    function loadContributionHistory(stokvelId) {
        db.collection('contributions')
            .where('userId', '==', userId)
            .where('stokvelId', '==', stokvelId)
            .orderBy('date', 'desc')
            .get()
            .then(querySnapshot => {
                const contributionsBody = document.getElementById('contributions-body');
                contributionsBody.innerHTML = '';
                
                if (querySnapshot.empty) {
                    contributionsBody.innerHTML = `
                        <tr>
                            <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                                No contributions found for this stokvel.
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                querySnapshot.forEach(doc => {
                    const contribution = doc.data();
                    const date = contribution.date ? new Date(contribution.date).toLocaleDateString('en-ZA') : 'N/A';
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap">${date}</td>
                        <td class="px-6 py-4 whitespace-nowrap">R${contribution.amount?.toLocaleString('en-ZA') || '0.00'}</td>
                        <td class="px-6 py-4 whitespace-nowrap">${contribution.method || 'N/A'}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs rounded-full ${contribution.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                ${contribution.status || 'pending'}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <a href="#" class="text-blue-600 hover:text-blue-800 text-sm">View</a>
                        </td>
                    `;
                    contributionsBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error loading contributions:', error);
            });
    }
    
    // Handle back to list button
    const backToListBtn = document.getElementById('back-to-list');
    if (backToListBtn) {
        backToListBtn.addEventListener('click', () => {
            document.getElementById('stokvel-details').classList.add('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // Handle join stokvel button
    const joinStokvelBtn = document.getElementById('join-stokvel-btn');
    if (joinStokvelBtn) {
        joinStokvelBtn.addEventListener('click', () => {
            document.getElementById('join-stokvel-modal').classList.remove('hidden');
        });
    }
    
    // Handle close join modal
    const closeJoinModal = document.getElementById('close-join-modal');
    if (closeJoinModal) {
        closeJoinModal.addEventListener('click', () => {
            document.getElementById('join-stokvel-modal').classList.add('hidden');
        });
    }
    
    // Handle cancel join
    const cancelJoin = document.getElementById('cancel-join');
    if (cancelJoin) {
        cancelJoin.addEventListener('click', () => {
            document.getElementById('join-stokvel-modal').classList.add('hidden');
        });
    }
    
    // Handle join stokvel form submission
    const joinStokvelForm = document.getElementById('join-stokvel-form');
    if (joinStokvelForm) {
        joinStokvelForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const stokvelType = joinStokvelForm['stokvel-select'].value;
            const monthlyAmount = parseFloat(joinStokvelForm['monthly-amount'].value);
            const paymentMethod = joinStokvelForm['join-payment-method'].value;
            
            if (!stokvelType || !monthlyAmount) {
                alert('Please fill in all fields');
                return;
            }
            
            // Determine stokvel details based on type
            let stokvelName, startDate, endDate;
            const today = new Date();
            
            switch (stokvelType) {
                case 'january':
                    stokvelName = 'January Stokvel';
                    startDate = new Date(today.getFullYear(), 1, 1); // February 1st
                    endDate = new Date(today.getFullYear(), 11, 1); // December 1st
                    break;
                case 'grocery':
                    stokvelName = 'Grocery Stokvel';
                    startDate = new Date(today.getFullYear(), 0, 1); // January 1st
                    endDate = new Date(today.getFullYear(), 9, 1); // October 1st
                    break;
                case 'planning':
                    stokvelName = 'Planning Ahead Stokvel';
                    startDate = new Date();
                    endDate = new Date(today.getFullYear(), today.getMonth() + 10, today.getDate()); // 10 months from now
                    break;
                default:
                    stokvelName = 'Stokvel';
                    startDate = new Date();
                    endDate = new Date(today.getFullYear(), today.getMonth() + 10, today.getDate());
            }
            
            // Create stokvel in Firestore
            const stokvelData = {
                name: stokvelName,
                type: stokvelName.split(' ')[0], // First word (January, Grocery, Planning)
                manager: 'To be assigned',
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                durationMonths: 10,
                monthlyContribution: monthlyAmount,
                members: [userId],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            db.collection('stokvels').add(stokvelData)
                .then(stokvelRef => {
                    // Add stokvel to user's stokvels array
                    const userStokvel = {
                        id: stokvelRef.id,
                        name: stokvelName,
                        type: stokvelName.split(' ')[0],
                        balance: 0,
                        monthlyContribution: monthlyAmount,
                        nextContributionDate: new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0],
                        contributionsCount: 0,
                        status: 'active',
                        projectedPayout: monthlyAmount * 10
                    };
                    
                    return db.collection('users').doc(userId).update({
                        stokvels: firebase.firestore.FieldValue.arrayUnion(userStokvel)
                    });
                })
                .then(() => {
                    alert('Successfully joined stokvel!');
                    document.getElementById('join-stokvel-modal').classList.add('hidden');
                    loadUserStokvels();
                })
                .catch(error => {
                    console.error('Error joining stokvel:', error);
                    alert('Error joining stokvel: ' + error.message);
                });
        });
    }
    
    // Handle contribution form submission
    const contributionForm = document.getElementById('contribution-form');
    if (contributionForm) {
        contributionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const stokvelId = contributionForm['contribution-stokvel'].value;
            const amount = parseFloat(contributionForm['contribution-amount'].value);
            
            if (!stokvelId || !amount) {
                alert('Please select a stokvel and enter an amount');
                return;
            }
            
            // Show payment modal
            document.getElementById('payment-modal').classList.remove('hidden');
            document.getElementById('modal-stokvel-name').textContent = 
                contributionForm['contribution-stokvel'].selectedOptions[0].text;
            document.getElementById('modal-amount').textContent = `R${amount.toLocaleString('en-ZA')}`;
            
            // Handle payment confirmation
            const confirmPayment = document.getElementById('confirm-payment');
            if (confirmPayment) {
                confirmPayment.onclick = () => {
                    const paymentMethod = document.getElementById('payment-method').value;
                    
                    // For demo purposes, we'll just simulate a successful payment
                    // In a real app, you would integrate with Paystack or another payment gateway here
                    
                    // Create contribution record
                    const contributionData = {
                        userId: userId,
                        stokvelId: stokvelId,
                        amount: amount,
                        method: paymentMethod,
                        date: new Date().toISOString(),
                        status: 'completed'
                    };
                    
                    db.collection('contributions').add(contributionData)
                        .then(() => {
                            // Update user's stokvel balance
                            return db.collection('users').doc(userId).get();
                        })
                        .then(userDoc => {
                            if (userDoc.exists) {
                                const userData = userDoc.data();
                                const stokvels = userData.stokvels || [];
                                const stokvelIndex = stokvels.findIndex(s => s.id === stokvelId);
                                
                                if (stokvelIndex !== -1) {
                                    // Update the specific stokvel
                                    stokvels[stokvelIndex].balance = 
                                        (stokvels[stokvelIndex].balance || 0) + amount;
                                    stokvels[stokvelIndex].contributionsCount = 
                                        (stokvels[stokvelIndex].contributionsCount || 0) + 1;
                                    
                                    // Calculate next contribution date (1 month from now)
                                    const nextDate = new Date();
                                    nextDate.setMonth(nextDate.getMonth() + 1);
                                    stokvels[stokvelIndex].nextContributionDate = 
                                        nextDate.toISOString().split('T')[0];
                                    
                                    // Update total savings
                                    const savingsTotal = (userData.savingsTotal || 0) + amount;
                                    
                                    // Check for discount eligibility
                                    let storeDiscount = userData.storeDiscount || 0;
                                    if (savingsTotal >= 10000 && !userData.funeralCover) {
                                        storeDiscount = 25;
                                    } else if (savingsTotal >= 5000 && !userData.funeralCover) {
                                        storeDiscount = 10;
                                    }
                                    
                                    return db.collection('users').doc(userId).update({
                                        stokvels: stokvels,
                                        savingsTotal: savingsTotal,
                                        storeDiscount: storeDiscount
                                    });
                                }
                            }
                        })
                        .then(() => {
                            alert('Contribution successful!');
                            document.getElementById('payment-modal').classList.add('hidden');
                            contributionForm.reset();
                            loadUserStokvels();
                        })
                        .catch(error => {
                            console.error('Error recording contribution:', error);
                            alert('Error recording contribution: ' + error.message);
                        });
                };
            }
        });
    }
    
    // Handle payment modal close
    const closeModal = document.getElementById('close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            document.getElementById('payment-modal').classList.add('hidden');
        });
    }
    
    const cancelPayment = document.getElementById('cancel-payment');
    if (cancelPayment) {
        cancelPayment.addEventListener('click', () => {
            document.getElementById('payment-modal').classList.add('hidden');
        });
    }
    
    // Handle view rules button
    const viewRulesBtn = document.getElementById('view-rules');
    if (viewRulesBtn) {
        viewRulesBtn.addEventListener('click', () => {
            document.getElementById('rules-modal').classList.remove('hidden');
            
            // Load stokvel rules (in a real app, this would come from Firestore)
            const rulesContent = document.getElementById('rules-content');
            rulesContent.innerHTML = `
                <h3>Stokvel Rules and Terms</h3>
                <p>By joining this stokvel, you agree to the following terms:</p>
                <ul>
                    <li>Monthly contributions must be made on or before the due date</li>
                    <li>Late payments may incur a penalty fee</li>
                    <li>Members must participate for the full term to receive payout</li>
                    <li>Early withdrawals may be subject to fees (Planning Ahead Stokvel only)</li>
                    <li>The stokvel manager has final say in any disputes</li>
                </ul>
                <p>Failure to comply with these rules may result in removal from the stokvel without refund.</p>
            `;
        });
    }
    
    // Handle close rules modal
    const closeRulesModal = document.getElementById('close-rules-modal');
    if (closeRulesModal) {
        closeRulesModal.addEventListener('click', () => {
            document.getElementById('rules-modal').classList.add('hidden');
        });
    }
    
    // Initial load
    loadUserStokvels();
});