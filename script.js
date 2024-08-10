document.addEventListener("DOMContentLoaded", function() {
    const menuItems = document.querySelectorAll(".menu-item");
    const inputModal = document.getElementById('inputModal');
    const downloadButton = document.getElementById('downloadAllButton');
    downloadButton.addEventListener('click', downloadAllFiles);
    const closeButtons = document.querySelectorAll('.close-button');
    let currentProjectId = null;
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            projectModal.style.display = 'none';
            inputModal.style.display = 'none';
        });
    });
    window.addEventListener('click', function(event) {
        if (event.target === projectModal || event.target === inputModal) {
            projectModal.style.display = 'none';
            inputModal.style.display = 'none'; 
        }
    });
    function loadContent(target) {
        let content = "";
        switch (target) {
            case "ChangeSecuritykey":
                content = `
                <div id="ChangeSecuritykey">
                    <h2>Change Security Key</h2>
                    <form id="changeKeyForm">
                        <div class="form-group">
                            <label for="currentKeyInput">Current Security Key:</label>
                            <input type="password" id="currentKeyInput" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="newKeyInput">New Security Key:</label>
                            <input type="password" id="newKeyInput" class="form-control" required>
                        </div>
                        <button type="submit" class="btn btn-primary">Change Key</button>
                    </form>
                    <div id="keyChangeMessage" style="display: none;"></div>
                </div>
                `;
                break;
            case "projects":
                content = `
                <div id="projectsContent">
                    <h2>Projects</h2>
                    <button id="addNewProjectButton" class="btn btn-primary">
                        <span class="icon-plus"></span> Add New
                    </button>
                    <button id="myProjectsButton" class="btn btn-secondary">
                        <span class="icon-folder-open"></span> My Projects
                    </button>
                    <div id="usersList"></div>
                    <div id="projectsList"></div> 
                </div>
                `;
                break;
            case "contact":
                content = `
                <div id="approvalsContent">
                    <h2>Approval Requests</h2>
                </div>
                `;
                displayApprovals(); 
                break;
            default:
                content = `
                    <p>Welcome! Select a menu item to see its content.</p>
                `;
                break;
        }
        document.getElementById("content").innerHTML = content;
        menuItems.forEach(item => {
            if (item.getAttribute("data-target") === target) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        });
        if (target === "projects") {
            document.getElementById("addNewProjectButton").addEventListener('click', function() {
                document.getElementById('projectModal').style.display = 'block';
                fetchUsersByRole('Designer'); 
                fetchUsersByRole('Developer');
                fetchUsersByRole('Tester');
                fetchUsersByRole('Manager');
            });
            document.getElementById("myProjectsButton").addEventListener('click', function() {
                displayProjects();
            });
        }
        if (target === "ChangeSecuritykey") {
            const changeKeyForm = document.getElementById("changeKeyForm");
            console.log("Change Key Form:", changeKeyForm);
        
            if (changeKeyForm) {
                changeKeyForm.addEventListener("submit", changeSecurityKey);
            } else {
                console.error("Element with ID 'changeKeyForm' not found.");
            }
        }
    }
    loadContent("projects");
    menuItems.forEach(function(item) {
        item.addEventListener("click", function(event) {
            event.preventDefault();
            const target = item.getAttribute("data-target");
            loadContent(target);
        });
    });
    document.getElementById('acceptButton').addEventListener('click', function() {
        if (currentProjectId) {
            handleAccept(currentProjectId);
        }
    });
    document.getElementById('rejectButton').addEventListener('click', function() {
        if (currentProjectId) {
            handleReject(currentProjectId);
        }
    });
    document.getElementById('projectForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const projectName = document.getElementById('projectNameInput').value;
        const selectedUser = document.querySelector('input[name="user"]:checked');
    });
    function fetchFileLinks(projectId) {
        const storageRef = firebase.storage().ref(`projects/${projectId}`);
        storageRef.listAll().then((res) => {
            const linksContainer = document.getElementById('fileLinksContainer');
            linksContainer.innerHTML = '';
            res.items.forEach((itemRef) => {
                itemRef.getDownloadURL().then((url) => {
                    const linkElement = document.createElement('a');
                    linkElement.href = url;
                    linkElement.textContent = itemRef.name;
                    linkElement.target = '_blank';
                    linksContainer.appendChild(linkElement);
                    linksContainer.appendChild(document.createElement('br'));
                });
            });
            downloadButton.style.display = res.items.length > 0 ? 'block' : 'none';
        }).catch((error) => {
            console.error("Error fetching file links: ", error);
        });
    }
    function markProjectAsCompleted(projectId) {
        currentProjectId = projectId;
        inputModal.style.display = 'block';
        fetchFileLinks(projectId);
    }
    function downloadAllFiles() {
        const storageRef = firebase.storage().ref(`projects/${currentProjectId}`);
        
        storageRef.listAll().then((res) => {
            const zip = new JSZip();
            const promises = res.items.map((itemRef) => {
                return itemRef.getDownloadURL().then((url) => {
                    return fetch(url).then((response) => response.blob()).then((blob) => {
                        zip.file(itemRef.name, blob);
                    });
                });
            });
            Promise.all(promises).then(() => {
                zip.generateAsync({ type: 'blob' }).then((content) => {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(content);
                    link.download = `${currentProjectId}.zip`;
                    link.click();
                });
            });
        }).catch((error) => {
            console.error("Error downloading files: ", error);
        });
    }
    function displayProjects() {
        const db = firebase.firestore();
        const projectsRef = db.collection('projects');
        const projectsListContainer = document.getElementById('projectsList');
        projectsListContainer.innerHTML = ""; 
        projectsRef.orderBy('createdAt', 'desc').get().then((querySnapshot) => {
            if (querySnapshot.empty) {
                projectsListContainer.innerHTML = "<p>No projects found.</p>";
            } else {
                querySnapshot.forEach((doc, index) => {
                    const projectData = doc.data();
                    const projectDiv = document.createElement('div');
                    projectDiv.classList.add('projectItem');
    
                    const designerStatusId = `designerStatus-${doc.id}`;
                    const developerStatusId = `developerStatus-${doc.id}`;
                    const testerStatusId = `testerStatus-${doc.id}`;
                    const managerStatusId = `managerStatus-${doc.id}`;
    
                    projectDiv.innerHTML = `
                        <h3><strong>Project name: </strong>${projectData.projectName} - <span class="badge badge-info">${projectData.status}</span></h3>
                        <p><strong>Designer:</strong> ${projectData.designer} <span id="${designerStatusId}"></span></p>
                        <p><strong>Developer:</strong> ${projectData.developer} <span id="${developerStatusId}"></span></p>
                        <p><strong>Tester:</strong> ${projectData.tester} <span id="${testerStatusId}"></span></p>
                        <p><strong>Product Manager:</strong> ${projectData.manager} <span id="${managerStatusId}"></span></p>
                        <p><strong>Created At:</strong> ${projectData.createdAt.toDate().toLocaleString()}</p>
                        <button class="btn btn-danger delete-btn" data-project-id="${doc.id}">
                            <span class="icon-trash"></span> Delete
                        </button>
                    `;
                    const userEmail = 'admin@gmail.com'; 
                    Promise.all([
                        fetchUserStatus(doc.id, projectData.designer, designerStatusId),
                        fetchUserStatus(doc.id, projectData.developer, developerStatusId),
                        fetchUserStatus(doc.id, projectData.tester, testerStatusId),
                        fetchUserStatus(doc.id, projectData.manager, managerStatusId)
                    ]).then(([designerStatus, developerStatus, testerStatus, managerStatus]) => {
                        const userStatus = (projectData.designer === userEmail) ? designerStatus :
                                            (projectData.developer === userEmail) ? developerStatus :
                                            (projectData.tester === userEmail) ? testerStatus : 
                                            (projectData.manager === userEmail) ? managerStatus : null;
                        if (userStatus === "Not Completed") {
                            const finishButton = document.createElement('button');
                            finishButton.classList.add('btn', 'btn-success');
                            finishButton.textContent = 'Finish Work';
                            finishButton.addEventListener('click', () => markProjectAsCompleted(doc.id));
                            projectDiv.appendChild(finishButton);
                        }
                    });
                    projectsListContainer.appendChild(projectDiv);
                    if (index < querySnapshot.size - 1) {
                        const spacer = document.createElement('div');
                        spacer.style.height = '20px';
                        projectsListContainer.appendChild(spacer);
                    }
                });
                document.querySelectorAll('.delete-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const projectId = this.getAttribute('data-project-id');
                        if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                            deleteProject(projectId);
                        }
                    });
                });
            }
        }).catch((error) => {
            console.error("Error fetching projects:", error);
        });
    }

    function deleteProject(projectId) {
        const db = firebase.firestore();
        const storage = firebase.storage();
        const projectRef = db.collection('projects').doc(projectId);
        const projectStorageRef = storage.ref().child(`projects/${projectId}`);
        projectRef.delete()
            .then(() => {
                projectStorageRef.listAll()
                    .then((result) => {
                        const deletePromises = result.items.map(fileRef => fileRef.delete());
                        return Promise.all(deletePromises);
                    })
                    .then(() => {
                        alert('Project and its files deleted successfully!');
                        displayProjects();
                    })
                    .catch((error) => {
                        alert('Project deleted from Firestore but there was an error deleting project files from storage.');
                    });
            })
            .catch((error) => {
                alert('Error deleting project. Please try again.');
            });
    }
    
            function fetchUserStatus(projectId, userEmail, elementId) {
                const db = firebase.firestore();
                const projectRef = db.collection('projects').doc(projectId);
                const workRef = projectRef.collection('work').doc(userEmail);
            
                return workRef.get().then((workDoc) => {
                    const statusElement = document.getElementById(elementId);
                    if (workDoc.exists) {
                        const status = workDoc.data().completed;
                        statusElement.textContent = ` - Status: ${status}`;
                        return status;
                    } else {
                        statusElement.textContent = " - Status: No status";
                        return "Not Completed"; 
                    }
                }).catch((error) => {
                    console.error("Error fetching user work document:", error);
                    return "Not Completed"; 
                });
            }
            function fetchUsersByRole(role) {
                const usersRef = firebase.database().ref('users');
                usersRef.once('value', (snapshot) => {
                    const selectElement = document.getElementById(`${role.toLowerCase()}Select`);
                    selectElement.innerHTML = `<option value=''>Select ${role.toLowerCase()}</option>`; // Reset select options
            
                    snapshot.forEach((childSnapshot) => {
                        const userData = childSnapshot.val();
                        if (userData.role === role && userData.approved === 'yes') {
                            const option = document.createElement('option');
                            option.value = userData.email;
                            option.textContent = `${userData.name} (${userData.email})`;
                            selectElement.appendChild(option);
                        }
                    });
                    if (selectElement.children.length === 1) {
                        selectElement.innerHTML += `<option value="">No ${role.toLowerCase()}s found or not approved.</option>`;
                    }
                }).catch((error) => {
                    console.error("Error fetching users by role:", error);
                });
            }
            document.getElementById('projectForm').addEventListener('submit', function(event) {
                event.preventDefault();
                const projectName = document.getElementById('projectNameInput').value;
                const designerEmail = document.getElementById('designerSelect').value;
                const developerEmail = document.getElementById('developerSelect').value;
                const testerEmail = document.getElementById('testerSelect').value;
                const managerEmail = document.getElementById('managerSelect').value;
                
                
                if (projectName && designerEmail && developerEmail && testerEmail && managerEmail) {
                    handleProjectSubmission(projectName, designerEmail, developerEmail, testerEmail,managerEmail);
                } else {
                    alert('Please fill out all fields.');
                }
            });
            function handleProjectSubmission(projectName, designerEmail, developerEmail, testerEmail, managerEmail) {
                const db = firebase.firestore();
                const projectsRef = db.collection('projects');
                const projectData = {
                    projectName: projectName,
                    status: "Not Completed",
                    designer: designerEmail,
                    developer: developerEmail,
                    tester: testerEmail,
                    manager: managerEmail,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp() 
                };
                projectsRef.add(projectData).then((docRef) => {
                    const workRef = docRef.collection('work');
                    const designerDoc = workRef.doc(designerEmail);
                    const developerDoc = workRef.doc(developerEmail);
                    const testerDoc = workRef.doc(testerEmail);
                    const managerDoc = workRef.doc(managerEmail);
                    const promises = [];
                    promises.push(designerDoc.set({
                        role: 'Designer',
                        completed: 'Not Completed'
                    }));
                    promises.push(developerDoc.set({
                        role: 'Developer',
                        completed: 'Pending'
                    }));
                    promises.push(testerDoc.set({
                        role: 'Tester',
                        completed: 'Pending'
                    }));
                    promises.push(managerDoc.set({
                        role: 'Manager',
                        completed: 'Pending'
                    }));
                    return Promise.all(promises);
                }).then(() => {
                    alert('Project Created Successfully');
                    document.getElementById('projectModal').style.display = 'none';
                }).catch((error) => {
                    console.error('Error adding project or work documents:', error);
                });
            }
            function signInAdmin(currentKey) {
                return firebase.auth().signInWithEmailAndPassword('admin@gmail.com', currentKey);
            }
            function changeSecurityKey(event) {
                event.preventDefault(); 
                const currentKey = document.getElementById("currentKeyInput").value;
                const newKey = document.getElementById("newKeyInput").value;
                const keyChangeMessage = document.getElementById("keyChangeMessage");
                const user = firebase.auth().currentUser;
                if (!user || user.email !== 'admin@gmail.com') {
                    signInAdmin(currentKey)
                        .then(() => {
                            return firebase.auth().currentUser.reauthenticateWithCredential(
                                firebase.auth.EmailAuthProvider.credential('admin@gmail.com', currentKey)
                            );
                        })
                        .then(() => {
                            return firebase.auth().currentUser.updatePassword(newKey);
                        })
                        .then(() => {
                            keyChangeMessage.style.display = "block";
                            keyChangeMessage.textContent = "Security key changed successfully.";
                            document.getElementById("changeKeyForm").reset();
                        })
                        .catch(error => {
                            keyChangeMessage.style.display = "block";
                            keyChangeMessage.textContent = `Error changing key: ${error.message}`;
                        });
                } else {
                    firebase.auth().currentUser.reauthenticateWithCredential(
                        firebase.auth.EmailAuthProvider.credential('admin@gmail.com', currentKey)
                    )
                    .then(() => {
                        return firebase.auth().currentUser.updatePassword(newKey);
                    })
                    .then(() => {
                        keyChangeMessage.style.display = "block";
                        keyChangeMessage.textContent = "Security key changed successfully.";
                        document.getElementById("changeKeyForm").reset();
                    })
                    .catch(error => {
                        keyChangeMessage.style.display = "block";
                        keyChangeMessage.textContent = `Error changing key: ${error.message}`;
                    });
                }
            }  
});