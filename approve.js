function displayApprovals() {
    const approvalsContainer = document.getElementById('content');
    approvalsContainer.innerHTML = "";
    const usersRef = firebase.database().ref('users');
    usersRef.once('value', (snapshot) => {
        let hasApprovals = false;
        snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            const email = userData.email;
            const name = userData.name;
            const password = userData.password;
            const approved = userData.approved || 'no';
            const role = userData.role; 
            if (approved === 'no') {
                hasApprovals = true;
                const approvalDiv = document.createElement('div');
                approvalDiv.classList.add('approvalItem');
                const nameParagraph = document.createElement('p');
                nameParagraph.textContent = `Name: ${name}`;
                approvalDiv.appendChild(nameParagraph);
                const emailParagraph = document.createElement('p');
                emailParagraph.textContent = `Email: ${email}`;
                approvalDiv.appendChild(emailParagraph);
                const roleParagraph = document.createElement('p');
                roleParagraph.textContent = `Role: ${role}`;
                approvalDiv.appendChild(roleParagraph);
                const approveButton = document.createElement('button');
                approveButton.textContent = 'Approve';
                approveButton.classList.add('approve-btn'); 
                approveButton.addEventListener('click', () => {
                    usersRef.child(childSnapshot.key).update({ approved: 'yes' })
                        .then(() => {
                            createAuthentication(email, password).then(() => {
                                usersRef.child(childSnapshot.key).update({ password: null });
                                approvalDiv.remove();
                                if (!approvalsContainer.querySelector('.approvalItem')) {
                                    approvalsContainer.innerHTML = "<p>No pending approvals.</p>";
                                }
                            });
                        })
                        .catch((error) => {
                            console.error('Error updating approval status:', error);
                        });
                });
                approvalDiv.appendChild(approveButton);
                const rejectButton = document.createElement('button');
                rejectButton.textContent = 'Reject';
                rejectButton.classList.add('reject-btn'); 
                rejectButton.addEventListener('click', () => {
                    confirmAndDelete(email);
                });
                approvalDiv.appendChild(rejectButton);
                approvalsContainer.appendChild(approvalDiv);
            }
        });
        if (!hasApprovals) {
            approvalsContainer.innerHTML = "<p>No pending approvals.</p>";
        }
    });
}

function createAuthentication(email, password) {
    return firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            alert(`Authentication created for ${email}`);
        })
        .catch((error) => {
            console.error(`Error creating authentication for ${email}: ${error.message}`);
            alert(`Error creating authentication: ${error.message}`);
        });
}
function confirmAndDelete(email) {
    const confirmed = confirm(`Are you sure you want to delete ${email}?`);
    if (confirmed) {
        const usersRef = firebase.database().ref('users');

        usersRef.orderByChild('email').equalTo(email).once('value')
            .then(snapshot => {
                snapshot.forEach(childSnapshot => {
                    childSnapshot.ref.remove()
                        .then(() => {
                            alert(`User ${email} deleted successfully.`);
                            displayApprovals();
                        })
                        .catch((error) => {
                            console.error('Error deleting user:', error);
                            alert('An error occurred while deleting user. Please try again.');
                        });
                });
            })
            .catch((error) => {
                console.error('Error finding user to delete:', error);
                alert('An error occurred while finding the user. Please try again.');
            });
    }
}
