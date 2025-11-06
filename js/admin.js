$(document).ready(() => {

    // ✅ Toast container (auto-create if missing)
    if (!$("#toast-container").length) {
        $("body").append('<div id="toast-container" class="fixed top-5 right-5 z-50 space-y-2"></div>');
    }

    // ✅ Cancel buttons
    $('#cancel-image').on('click', () => {
        $('#upload-image-form')[0].reset();
        $('#image-preview-container').addClass('hidden');
    });

    $('#cancel-video').on('click', () => {
        $('#add-video-form')[0].reset();
        $('#video-preview-container').addClass('hidden');
    });

    // ✅ Initialize CKEditor if present
    if ($('#mission-editor').length) {
        CKEDITOR.replace('mission-editor');
    }

    // ✅ Image preview
    $('#image-upload').on('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                $('#image-preview').attr('src', e.target.result);
                $('#image-preview-container').removeClass('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    // ✅ User menu toggle


    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active tab
            document.querySelectorAll('.tab-button').forEach(t => {
                t.classList.remove('tab-active');
            });
            this.classList.add('tab-active');

            // Show the selected form
            const type = this.getAttribute('data-type');
            document.querySelectorAll('.media-form').forEach(form => {
                form.classList.add('hidden');
            });
            document.getElementById(`${type}-form`).classList.remove('hidden');
        });
    });


    // ✅ Tailwind Toast Creator
    function showToast(message, type = "success", duration = 3000) {
        const toastContainer = $("#toast-container");
        toastContainer.children().remove(); // remove old toasts

        const bgColor = {
            success: "bg-green-500",
            error: "bg-red-500",
            warning: "bg-yellow-500",
            info: "bg-blue-500"
        }[type] || "bg-blue-500";

        const toast = $(`
            <div class="toast transform transition-all duration-300 ease-in-out opacity-0 translate-y-2 
                ${bgColor} text-white px-4 py-2 rounded-xl shadow-lg flex items-center justify-between min-w-[200px] max-w-xs">
                <span class="text-sm font-medium">${message}</span>
                <button class="ml-3 text-white font-bold focus:outline-none">&times;</button>
            </div>
        `);

        toastContainer.append(toast);
        setTimeout(() => toast.removeClass("opacity-0 translate-y-2"), 50);

        const removeToast = () => {
            toast.addClass("opacity-0 translate-y-2");
            setTimeout(() => toast.remove(), 300);
        };

        toast.find("button").on("click", removeToast);
        setTimeout(removeToast, duration);
    }

    // ✅ Form submission logic
    $("#upload-image-form").on("submit", (e) => {
        e.preventDefault();

        const imageFile = $('#image-upload')[0].files[0];
        const imageTitle = $('#image-title').val().trim();
        const imageDescription = $('#image-description').val().trim();
        const imageCategory = $('#image-category').val();

        // ✅ Validation
        if (!imageFile) return showToast("Please select an image to upload.", "warning");
        if (!imageTitle) return showToast("Please enter an image title.", "warning");
        if (!imageDescription) return showToast("Please enter a description.", "warning");
        if (!imageCategory) return showToast("Please select a category.", "warning");

        const imageFeatured = $('#image-featured').is(':checked') ? 1 : 0;

        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('title', imageTitle);
        formData.append('description', imageDescription);
        formData.append('category', imageCategory);
        formData.append('featured', imageFeatured);

        const uploadBtn = $("#upload-image-form button[type='submit']");
        const originalHtml = uploadBtn.html();

        // ✅ Show spinner with dimmed button
        uploadBtn.prop("disabled", true)
            .addClass("opacity-70 cursor-not-allowed")
            .html(`<i class="fas fa-spinner fa-spin mr-2"></i> Uploading...`);

        $.ajax({
            url: '/add/media/add/image',
            type: 'POST',
            data: formData,
            dataType: 'json',
            contentType: false,
            processData: false,
            xhr: function () { // ✅ progress bar support
                const xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener("progress", function (e) {
                    if (e.lengthComputable) {
                        const percent = Math.round((e.loaded / e.total) * 100);
                        uploadBtn.html(`<i class="fas fa-spinner fa-spin mr-2"></i> Uploading ${percent}%`);
                    }
                });
                return xhr;
            },
            success: function (response) {
                if (typeof response !== 'object') {
                    showToast("Unexpected response from server.", "error");
                    return;
                }

                if (response.code === 200) {
                    $("#upload-image-form")[0].reset();
                    $("#image-preview-container").addClass("hidden");
                    showToast(response.message || "Image uploaded successfully!", "success");
                } else {
                    showToast(response.message || "Something went wrong!", "warning");
                }
            },
            error: function (err) {
                console.error(err);
                showToast("Upload failed. Please try again.", "error");
            },
            complete: function () {
                // ✅ Restore button
                uploadBtn.prop("disabled", false)
                    .removeClass("opacity-70 cursor-not-allowed")
                    .html(originalHtml);
            }
        });
    });

    $("#add-video-form").on("submit", (e)=>{
        e.preventDefault();
        const videourl = $('#video-url').val().trim();
        const videotitle = $('#video-title').val().trim();
        const videodescription = $('#video-description').val().trim();
        const videocategory = $('#video-category').val();

        // ✅ Validation
        if (!videourl) return showToast("Please enter video url.", "warning");
        if (!videotitle) return showToast("Please enter an image title.", "warning");
        if (!videodescription) return showToast("Please enter a description.", "warning");
        if (!videocategory) return showToast("Please select a category.", "warning");
        const formData = new FormData();
        formData.append('video', videourl);
        formData.append('title', videotitle);
        formData.append('description', videodescription);
        formData.append('category', videocategory);

        const uploadBtn = $("#add-video-form button[type='submit']");
        const originalHtml = uploadBtn.html();

        uploadBtn.prop("disabled", true)
            .addClass("opacity-70 cursor-not-allowed")
            .html(`<i class="fas fa-spinner fa-spin mr-2"></i> Uploading...`);


        $.ajax({
            url: '/add/media/add/video',
            type: 'POST',
            data: formData,
            dataType: 'json',
            contentType: false,
            processData: false,
            xhr: function () { // ✅ progress bar support
                const xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener("progress", function (e) {
                    if (e.lengthComputable) {
                        const percent = Math.round((e.loaded / e.total) * 100);
                        uploadBtn.html(`<i class="fas fa-spinner fa-spin mr-2"></i> Uploading ${percent}%`);
                    }
                });
                return xhr;
            },
            success: function (response) {
                if (typeof response !== 'object') {
                    showToast("Unexpected response from server.", "error");
                    return;
                }

                if (response.code === 200) {
                    $("#add-video-form")[0].reset();
                    $("#video-preview-container").addClass("hidden");
                    showToast(response.message || " Video uploaded successfully!", "success");
                } else {
                    showToast(response.message || "Something went wrong!", "warning");
                }
            },
            error: function (err) {
                console.error(err);
                showToast("Upload failed. Please try again.", "error");
            },
            complete: function () {
                // ✅ Restore button
                uploadBtn.prop("disabled", false)
                    .removeClass("opacity-70 cursor-not-allowed")
                    .html(originalHtml);
            }
        });
    })

});
