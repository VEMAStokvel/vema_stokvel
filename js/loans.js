import { db, auth } from './firebase.js';

// Loans management functions
document.addEventListener('DOMContentLoaded', () => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    
    // Calculate loan repayment
    function calculateRepayment() {
        const amount = parseFloat(document.getElementById('loan-amount-slider').value);
        const term = parseInt(document.getElementById('loan-term').value);
        
        // Update input field
        document.getElementById('loan-amount-input').value = amount;
        
        // Calculate interest (5% simple interest)
        const interest = amount * 0.05 * (term / 12);
        const total = amount + interest;
        const monthly = total / term;
        
        // Update summary
        document.getElementById('loan-summary-amount').textContent = `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
        document.getElementById('loan-summary-term').textContent = `${term} months`;
        document.getElementById('loan-summary-interest').textContent = `R${interest.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
        document.getElementById('loan-summary-total').textContent = `R${total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
        document.getElementById('loan-summary-payment').textContent = `R${monthly.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
        if (document.getElementById('loan-amount')) {
            document.getElementById('loan-amount').value = amount;
            document.getElementById('loan-repayment').textContent = `R${monthly.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
        }

    }
    
    // Load user's loans
    function loadUserLoans() {
        db.collection('loans')
            .where('userId', '==', userId)
            .orderBy('applicationDate', 'desc')
            .get()
            .then(querySnapshot => {
                const loansBody = document.getElementById('loans-body');
                loansBody.innerHTML = '';
                
                if (querySnapshot.empty) {
                    loansBody.innerHTML = `
                        <tr>
                            <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                                You don't have any loans yet.
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                querySnapshot.forEach(doc => {
                    const loan = doc.data();
                    const date = loan.applicationDate ? new Date(loan.applicationDate.toDate()).toLocaleDateString('en-ZA') : 'N/A';
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-blue-600">${doc.id.substring(0, 8)}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div>R${loan.amount?.toLocaleString('en-ZA') || '0.00'}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div>${date}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div>${loan.term} months</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs rounded-full ${loan.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                                                       loan.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                                                       'bg-yellow-100 text-yellow-800'}">
                                ${loan.status || 'pending'}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a href="#" class="text-blue-600 hover:text-blue-900 view-loan" data-id="${doc.id}">View</a>
                        </td>
                    `;
                    loansBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error loading loans:', error);
            });
    }
    
    // Load referral earnings
    function loadReferralEarnings() {
        db.collection('referrals')
            .where('referrerId', '==', userId)
            .orderBy('date', 'desc')
            .get()
            .then(querySnapshot => {
                const referralsBody = document.getElementById('referrals-body');
                referralsBody.innerHTML = '';
                
                let totalReferrals = 0;
                let activeReferrals = 0;
                let totalEarnings = 0;
                
                if (querySnapshot.empty) {
                    referralsBody.innerHTML = `
                        <tr>
                            <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                                No referral earnings yet
                            </td>
                        </tr>
                    `;
                } else {
                    querySnapshot.forEach(doc => {
                        const referral = doc.data();
                        totalReferrals++;
                        if (referral.status === 'active') activeReferrals++;
                        if (referral.commission) totalEarnings += referral.commission;
                        
                        const date = referral.date ? new Date(referral.date.toDate()).toLocaleDateString('en-ZA') : 'N/A';
                        
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm">${date}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div>${referral.referredName || 'N/A'}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div>${referral.loanAmount ? 'R' + referral.loanAmount.toLocaleString('en-ZA') : 'N/A'}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div>${referral.commission ? 'R' + referral.commission.toLocaleString('en-ZA') : 'N/A'}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 py-1 text-xs rounded-full ${referral.status === 'active' ? 'bg-green-100 text-green-800' : 
                                                                           referral.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                                                           'bg-gray-100 text-gray-800'}">
                                    ${referral.status || 'N/A'}
                                </span>
                            </td>
                        `;
                        referralsBody.appendChild(row);
                    });
                }
                
                // Update summary cards
                document.getElementById('total-referrals').textContent = totalReferrals;
                document.getElementById('active-referrals').textContent = activeReferrals;
                document.getElementById('total-earnings').textContent = `R${totalEarnings.toLocaleString('en-ZA')}`;
            })
            .catch(error => {
                console.error('Error loading referrals:', error);
            });
    }
    
    // Apply for loan button
    const applyLoanBtn = document.getElementById('apply-loan-btn');
    if (applyLoanBtn) {
        applyLoanBtn.addEventListener('click', () => {
            document.getElementById('loan-modal').classList.remove('hidden');
            calculateRepayment();
        });
    }
    
    // Close loan modal
    const closeLoanModal = document.getElementById('close-loan-modal');
    if (closeLoanModal) {
        closeLoanModal.addEventListener('click', () => {
            document.getElementById('loan-modal').classList.add('hidden');
        });
    }
    
    const cancelLoan = document.getElementById('cancel-loan');
    if (cancelLoan) {
        cancelLoan.addEventListener('click', () => {
            document.getElementById('loan-modal').classList.add('hidden');
        });
    }
    
    // Loan form submission
    const loanForm = document.getElementById('loan-form');
    if (loanForm) {
        loanForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const amount = parseFloat(document.getElementById('loan-amount').value);
            const term = parseInt(document.getElementById('loan-term-select').value);
            const purpose = document.getElementById('loan-purpose').value;
            
            // Create loan application
            const loanData = {
                userId: userId,
                amount: amount,
                term: term,
                purpose: purpose,
                status: 'pending',
                applicationDate: firebase.firestore.FieldValue.serverTimestamp(),
                interestRate: 5,
                monthlyRepayment: amount * 1.05 / term
            };
            
            db.collection('loans').add(loanData)
                .then(() => {
                    alert('Loan application submitted successfully!');
                    document.getElementById('loan-modal').classList.add('hidden');
                    loanForm.reset();
                    loadUserLoans();
                })
                .catch(error => {
                    console.error('Error submitting loan application:', error);
                    alert('Error submitting application: ' + error.message);
                });
        });
    }
    
    // Refer loan button
    const referLoanBtn = document.getElementById('refer-loan-btn');
    if (referLoanBtn) {
        referLoanBtn.addEventListener('click', () => {
            document.getElementById('referral-modal').classList.remove('hidden');
        });
    }
    
    // Close referral modal
    const closeReferralModal = document.getElementById('close-referral-modal');
    if (closeReferralModal) {
        closeReferralModal.addEventListener('click', () => {
            document.getElementById('referral-modal').classList.add('hidden');
        });
    }
    
    const cancelReferral = document.getElementById('cancel-referral');
    if (cancelReferral) {
        cancelReferral.addEventListener('click', () => {
            document.getElementById('referral-modal').classList.add('hidden');
        });
    }
    
    // Referral form submission
    const referralForm = document.getElementById('referral-form');
    if (referralForm) {
        referralForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const friendName = referralForm.querySelector('input[type="text"]').value;
            const friendEmail = referralForm.querySelector('input[type="email"]').value;
            const friendPhone = referralForm.querySelector('input[type="tel"]').value;
            
            // Create referral record
            const referralData = {
                referrerId: userId,
                referredName: friendName,
                referredEmail: friendEmail,
                referredPhone: friendPhone,
                date: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'pending',
                code: 'VEMA1234' // In a real app, this would be unique per user
            };
            
            db.collection('referrals').add(referralData)
                .then(() => {
                    alert('Referral sent successfully!');
                    document.getElementById('referral-modal').classList.add('hidden');
                    referralForm.reset();
                    loadReferralEarnings();
                })
                .catch(error => {
                    console.error('Error creating referral:', error);
                    alert('Error sending referral: ' + error.message);
                });
        });
    }
    
    // Loan calculator event listeners
    document.getElementById('loan-amount-slider').addEventListener('input', calculateRepayment);
    document.getElementById('loan-amount-input').addEventListener('input', function() {
        document.getElementById('loan-amount-slider').value = this.value;
        calculateRepayment();
    });
    document.getElementById('loan-term').addEventListener('change', calculateRepayment);
    
    // Initial load
    calculateRepayment();
    loadUserLoans();
    loadReferralEarnings();
});