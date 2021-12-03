var Course = function() {
    var OUTSIDE_HEIGHT = 30;
    var COURSE_NAV_HEIGHT = 40;
    var COURSE_MOBILE_NAV_HEIGHT = 58;
    var courseModuleId = null;
    var courseId = null;
    var courseSectionElm = null;
    var courseLessonElm = null;
    var isSmallScreen = false;
    var hasChatroom = true;
    var currentLessonId = null;

    var TYPE_DOCUMENT = '1';
    var TYPE_FORUM = '2';
    var TYPE_LESSON_PRESENTATION = '3';
    var TYPE_QUIZ = '4';
    var TYPE_SCORM = '5';
    var TYPE_LESSON_VIDEO = '6';
    var TYPE_LESSON_VIDEO_EMBED = '12';
    var TYPE_LESSON_FREE = '7';
    var TYPE_HOMEWORK = '8';
    var TYPE_SURVEY = '9';
    var TYPE_YOUTUBE_STREAMING = '10';
    var TYPE_CANVAS = '11';
    var TYPE_LESSON_ZOOM = '13';
    var TYPE_LESSON_MICROSOFT = '14';
    var TYPE_LESSON_WEBEX = '15';
    var TYPE_LESSON_GOOGLEMEET = '16';

    var enrolStudent = function(courseId, e){
        e.preventDefault();
        var me = $(e.target);
        me.addClass('disabled');
        me.attr('disabled', 'disabled');
        $.ajax({
            url: "/service/course/enrolStudent",
            type: 'post',
            data: {
                courseId: courseId,
                currentUrl: location.pathname ? location.pathname : "#"
            },
            dataType: 'json',
            success: function (r) {
                me.removeClass('disabled');
                me.removeAttr('disabled');
                if (r.success) {
                    if(r.redirect_url){
                        window.location.href = r.redirect_url;
                        return false;
                    }
                    if(r.message) {
                        App.showMessage(r.message);
                    }
                    if(r.message_html){
                        me.parent().html(r.message_html);
                    }
                } else {
                    App.showConfirm(r.message, function(){
                        if(r.error && r.error == 1){
                            $('#loginModal').modal('show');
                        }
                        else if(r.redirect_url){
                            window.location.href = r.redirect_url;
                            return false;
                        }
                    });
                }
            }
        });
        return false;
    };

    var cancelEnrolStudent = function(courseId, e, options){
        e.preventDefault();
        var me = $(e.target);
        me.addClass('disabled');
        me.attr('disabled', 'disabled');
        App.showConfirm("Vui lòng xác nhận bạn muốn hủy đăng ký khóa học này?", function(){
            $.ajax({
                url: "/service/course/cancelEnrolStudent",
                type: 'post',
                data: {courseId: courseId},
                dataType: 'json',
                success: function (r) {
                    if (r.success) {
                        App.showMessage(r.message);
                        if(r.redirect_url){
                            location.href = r.redirect_url;
                        }
                        if(r.message_html){
                            me.parent().html(r.message_html);
                        }
                    } else {
                        App.showMessageWarning(r.message);
                    }
                }
            });
        });
        me.removeClass('disabled');
        me.removeAttr('disabled');
    };

    var enjoinStudent = function(courseId, e){
        e.preventDefault();
        location.href="/course/enjoin?id=" + courseId;
    };

    var resizeWindow = function(){
        if($(window).width() <= 768){
            Course.isSmallScreen = true;
        }

        var windowHeight = $(window).height();
        if(!Course.isSmallScreen){
            var height = windowHeight - OUTSIDE_HEIGHT;
            $('#course_section_panels').slimScroll({
                size: '5px',
                railOpacity : '0.4',
                distance: '0px',
                height: height - COURSE_NAV_HEIGHT + 'px'
            });
            $('#course_section_panels_right').slimScroll({
                size: '5px',
                railOpacity : '0.4',
                distance: '0px',
                height: height - COURSE_NAV_HEIGHT + 'px'
            });
            Course.courseLessonElm.css("height", height);

            // Set height for chat room
            $('#rocketChatIframe').height(windowHeight - OUTSIDE_HEIGHT - COURSE_NAV_HEIGHT);
        }
        else{
            $('#course_section_content').css({
                height: '200',
                'overflow-y': 'auto'
            });
            var height = windowHeight - COURSE_MOBILE_NAV_HEIGHT - OUTSIDE_HEIGHT;
            if(height <= 0) {
                height = 500;
            }
            Course.courseLessonElm.css("height", height);

            if($(window).width() < 767){
                $('.mobile .outer-enjoin').css({
                    'max-height':($(window).height() - 90 - 100)+'px'
                });
            }
        }
    };

    var setCurrentLesson = function(lessonId, courseId){
        /* @todo Nếu student id đăng nhập khác student id đăng nhập trước đó */
        var pastStudentId = localStorage.getItem('currentStudentId');
        if(pastStudentId !== AppCfg.user.id) {
            localStorage.clear();
        }
        if (typeof(Storage) !== "undefined") {
            try {
                localStorage.setItem("currentLessonId", lessonId);
                localStorage.setItem("currentCourseId", courseId);
                localStorage.setItem("currentStudentId", AppCfg.user.id);

                localStorage.setItem("last_lesson_"+courseId, lessonId);
                localStorage.setItem("last_student_"+courseId, AppCfg.user.id);
            } catch (e) {

            }
        } else {
            // Sorry! No Web Storage support..
        }
    };

    var getCurrentLesson = function(courseAccessId, studentAccessId){
        // Trigger go to lesson by Hashtag
        var lessonId = window.location.hash.substr(1);
        if(lessonId){
            var item = $('.item_hoclieu_title#'+lessonId);
            var moduleId = item.attr('data-module-id');
            setTimeout(function(){
                item.parents('.chuDeItemOuter').find('.chuDeItem').click();
                Course.studyLesson(lessonId, moduleId, item);
            }, 1000);
            return;
        }

        if (typeof(Storage) !== "undefined") {
            var lessonId = localStorage.getItem("currentLessonId");
            var courseId = localStorage.getItem("currentCourseId");
            var studentId = localStorage.getItem("currentStudentId");
            if(lessonId && courseId && courseId === courseAccessId && studentId === studentAccessId){
                $('#course_lesson_welcome').hide();
                var item = $('.item_hoclieu_title#'+lessonId);
                var moduleId = item.attr('data-module-id');
                setTimeout(function(){
                    item.parents('.chuDeItemOuter').find('.chuDeItem').click();
                    Course.studyLesson(lessonId, moduleId, item);
                }, 1000);

            }
            else{
                $('.chuDeItemOuter:first-child').find('.chuDeItem').click();
                Course.welcome();
            }
        } else {
            // Sorry! No Web Storage support..
        }
    };

    var initStudyCourse = function(courseId, studentAccessId){
        this.courseId = courseId;
        this.courseSectionElm = $('#course_section_content');
        this.courseLessonElm = $('#course_lesson_content');

        resizeWindow();

        if(!this.isSmallScreen){
            $('#tab_course_content').click(function(){
                $('#enjoin-course-outer').attr('class', 'course enjoin_course md_workspace');
            });
            $('#tab_course_document').click(function(){
                $('#enjoin-course-outer').attr('class', 'course enjoin_course md_workspace');
            });
            $('#tab_course_comment').click(function(){
                $('#enjoin-course-outer').attr('class', 'course enjoin_course lg_workspace');
            });
            $('#tab_lesson_comment').click(function(){
                $('#enjoin-course-outer').attr('class', 'course enjoin_course lg_workspace');
            });
            $('#tab_course_collapse').click(function(){
                $('#enjoin-course-outer').toggleClass('collapsed_workspace');
            });
        }
        else{
            $('#enjoin-course-outer').removeClass('md_workspace');
            $('#tab_course_content').click(function(){
                $(this).toggleClass('active');
                $('#course_section_content').parent().toggleClass('active');
                return false;
            });
            $('#tab_course_comment').click(function(){
                $(this).toggleClass('active');
                $('#course_section_comment').parent().toggleClass('active');
            });
            $('#tab_lesson_comment').click(function(){
                $(this).toggleClass('active');
                $('#course_lesson_comment').parent().toggleClass('active');
            });
            $('#tab_course_collapse').click(function(){
                $('#enjoin-course-outer').toggleClass('vertical_collapsed_workspace');
            });
        }

        getCurrentLesson(courseId, studentAccessId);
    };

    var showLoadingMessage = function (message) {
        if(this.isShowLoading){
            return;
        }

        this.isShowLoading = true;
        if(message === undefined || !message){
            message = "Vui lòng đợi vài giây, học liệu đang được tải về...";
        }
        this.courseLessonElm.html('<div class="alert-loading-outer"><div class="alert alert-loading alert-info m-3 text-center"><i class="fa fa-spin fa-spinner"></i> ' + message + '</div></div>');
    };

    var showErrorMessage = function (message) {
        if(message === undefined || !message){
            message = "Vui lòng đợi vài giây, học liệu đang được tải về...";
        }
        this.courseLessonElm.html('<div class="alert-error-outer"><div class="alert alert-error alert-danger m-3 text-center"><i class="fa fa-exclamation-triangle"></i> ' + message + '</div></div>');
    };

    var showLessonIframe = function (iframe, type) {
        var that = this;

        $('#enjoin-course-outer').attr('class', Course.isSmallScreen ? 'course enjoin_course' : 'course enjoin_course md_workspace');
        // var lessonHeight = that.courseLessonElm.height();
        // if(lessonHeight <= 0) {
        //     lessonHeight = 500;
        // }

        $('#course_lesson_welcome').hide();
        that.showLoadingMessage();
        that.courseLessonElm.append(iframe);
        that.courseLessonElm.find('iframe#course_lesson_iframe').on('load', function() {
            $(this).removeClass('loading');
            $(this).contents().find("head").append($("<style type='text/css'>#pdf-viewer{max-width: 100%!important;} </style>"));
            that.courseLessonElm.find('.alert-loading-outer').remove();
        });
    };

    var studyLesson = function(itemId, itemModuleId, me, reset){
        this.isShowLoading = false;
        this.currentLessonId = itemId;

        if(typeof(reset) == 'undefined') {
            reset = false;
        }
        me =  $('#'+ itemId);
        /* @todo lấy dữ liệu courseModuleId*/
        this.courseModuleId = me.attr("data-course-moudule-id");

        /* @todo Hiển thị tab lesson comment */
        // $(".course_tabs_container #tab_lesson_comment").show();
        lessonComment.initLessonComment(itemId, this.courseModuleId);
        lessonCommentRight.initLessonComment(itemId, this.courseModuleId);

        /* @todo Ẩn welcome*/
        $('#course_lesson_welcome').hide();
        $('.tracking-item.welcomeCourse').removeClass('active');

        /* @todo Ẩn menu course*/
        if($('.mobile .outer-enjoin').hasClass('active')) {
            $('.mobile .outer-enjoin').slideUp("slow");
            $('html,body').css({
                'height':'auto',
                'overflow':'initial'
            });
            var clsIcon = $('.super_container.mobile .toggle-menu-mobile').find('i').attr('class');
            if(clsIcon == 'fa fa-bars') {
                $('.super_container.mobile .toggle-menu-mobile').find('i').attr('class', 'fa fa-times');
            }else if(clsIcon == 'fa fa-times') {
                $('.super_container.mobile .toggle-menu-mobile').find('i').attr('class', 'fa fa-bars');
            }
            //$('.mobile .outer-enjoin').toggleClass('active');
        }

        /* @todo Thiết lập scorm*/
        window.parent.scorm_id = itemId;
        this.courseSectionElm.find('.hocLieuItem').removeClass('active');
        me.closest('.hocLieuItem').addClass('active');

        setCurrentLesson(itemId, this.courseId);

        // Show loading message
        this.showLoadingMessage();

        /* @todo Tính tổng thời gian truy cập học liệu */
        var data = {
            'user_id' : AppCfg.user.id,
            'course_id' : this.courseId,
            'course_module_id' : this.courseModuleId,
            'module_id' : itemModuleId,
            'instance_id' : this.currentLessonId
        };

        // NamNT tam thoi comment ngay 27/03/2020
        // setInterval(function () {
        //     $.post("/module/lms/service/courseModuleOnline/save", {data : data}, function (res) {});
        // }, 60000);

        switch(itemModuleId){
            case TYPE_SCORM:
                this.studyLessonScorm(itemId, me, reset);
                break;

            case TYPE_LESSON_PRESENTATION:
                this.studyLessonPresentation(itemId, me);
                break;

            case TYPE_QUIZ:
                this.studyQuiz(itemId, me);
                break;

            case TYPE_LESSON_VIDEO:
                this.studyLessonVideo(itemId, me);
                break;

            case TYPE_LESSON_VIDEO_EMBED:
                this.studyLessonVideoEmbed(itemId, me);
                break;

            case TYPE_LESSON_FREE:
                this.studyLessonFree(itemId, me);
                break;

            case TYPE_HOMEWORK:
                this.viewHomework(itemId, me);
                break;

            case TYPE_SURVEY:
                this.studySurvey(itemId, me);
                break;

            case TYPE_CANVAS:
                this.studyCanvas(itemId, me);
                break;

            case TYPE_YOUTUBE_STREAMING:
                this.studyLessonYoutubeStreaming(itemId, me);
                break;

            case TYPE_LESSON_ZOOM:
                this.studyLessonZoom(itemId, me);
                break;

            case TYPE_LESSON_MICROSOFT:
                this.studyLessonMicrosoft(itemId, me);
                break;

            case TYPE_LESSON_WEBEX:
                this.studyLessonWebex(itemId, me);
                break;

            case TYPE_LESSON_GOOGLEMEET:
                this.studyLessonGoogleMeet(itemId, me);
                break;
        }
        return;
    };

    var studyLessonScorm = function(itemId, e, reset){
        var that = this;
        var courseModuleId = that.courseModuleId;
        var courseId = that.courseId;
        $.ajax({
            url: "/module/lms/service/lessonScorm/getStudyScormInfo",
            type: 'post',
            data: {id: itemId, cid: courseId, cMId : courseModuleId, reset : reset},
            dataType: 'json',
            success: function (r) {
                if (r.success && r.data) {
                    /* @todo Xóa các key ispring */
                    var regex = new RegExp("ispring::{([A-Za-z0-9-]*)}");
                    for (var i = 0; i < localStorage.length; i++) {
                        var res = regex.test(localStorage.key(i));
                        if(res === true) {
                            localStorage.removeItem(localStorage.key(i));
                        }
                    }
                    /* @todo init sco rte*/
                    ScormRTE.init(that.courseLessonElm, r.data, r.data.tableDocument);
                } else {
                    App.showMessageWarning(r.message);
                    $('.alert-loading-outer').remove();
                    $('#course_lesson_content').append(
                        '<div class="alert alert-warning rounded-0 text-center" role="alert">\n' +
                         r.message + '</div>'
                    )
                }
            }
        });
    };

    var studyLessonScormBk = function(itemId, e){
        var courseModuleId = this.courseModuleId;
        var courseId = this.courseId;
        var that = this;
        $.ajax({
            url: "/module/lms/service/lessonScorm/getStudyUrl",
            type: 'post',
            data: {id: itemId, cid: courseId, cMId : courseModuleId},
            dataType: 'json',
            success: function (r) {
                if (r.success && r.data.url) {
                    var styleClass = Course.isSmallScreen ? 'course enjoin_course' : 'course enjoin_course md_workspace';
                    $('#enjoin-course-outer').attr('class', styleClass);
                    var lessonHeight = $('#course_lesson_content').height();
                    that.courseLessonElm.html('<iframe class="course_lesson_scorm_iframe" id="course_lesson_iframe" src="'+r.data.url+'" width="100%" height="'+lessonHeight+'" frameBorder="0">Browser not compatible.</iframe>');
                } else {
                    App.showMessageWarning(r.message);
                }
            }
        });
    };

    var studyLessonVideo = function(itemId, e) {
        var courseModuleId = this.courseModuleId;
        var courseId = this.courseId;
        var that = this;
        $.ajax({
            url: "/module/lms/service/lessonVideo/getStudyUrl",
            type: 'post',
            data: {id: itemId, cid: courseId, cMId : courseModuleId},
            dataType: 'json',
            success: function (r) {
                if (r.success && r.data.url) {
                    var iframe = '<iframe class="course_lesson_video_iframe" id="course_lesson_iframe" src="'+r.data.url+'" width="100%" frameBorder="0">Browser not compatible.</iframe>';
                    that.showLessonIframe(iframe);
                } else {
                    that.showErrorMessage(r.message);
                }
            }
        });
    };

    var studyLessonVideoEmbed = function(itemId, e) {
        var courseModuleId = this.courseModuleId;
        var courseId = this.courseId;
        var that = this;
        $.ajax({
            url: "/module/lmsCourse/service/lessonVideoEmbed/getStudyUrlVideoEmbed",
            type: 'post',
            data: {id: itemId, cid: courseId, cMId : courseModuleId},
            dataType: 'json',
            success: function (r) {
                if (r.success && r.data.url) {
                    var iframe = '<iframe class="course_lesson_video_iframe" id="course_lesson_iframe" src="'+r.data.url+'" width="100%" frameBorder="0">Browser not compatible.</iframe>';
                    that.showLessonIframe(iframe);
                } else {
                    that.showErrorMessage(r.message);
                }
            }
        });
    };

    var studyLessonPresentation = function(itemId, e) {
        var courseModuleId = this.courseModuleId;
        var courseId = this.courseId;
        var that = this;
        $.ajax({
            url: "/module/lms/service/lessonPresentation/getStudyUrl",
            type: 'post',
            data: {id: itemId, cid: courseId, cMId : courseModuleId},
            dataType: 'json',
            success: function (r) {
                if (r.success && r.data.url) {
                    var iframe = '<iframe class="course_lesson_presentation_iframe" id="course_lesson_iframe" src="' + r.data.url + '" width="100%" frameBorder="0">Browser not compatible.</iframe>';
                    that.showLessonIframe(iframe);
                } else {
                    that.showErrorMessage(r.message);
                }
            }
        });
    };

    var studyLessonFree = function(itemId, e) {
        var courseModuleId = this.courseModuleId;
        var courseId = this.courseId;
        var that = this;

        $.ajax({
            url: "/module/lms/service/lessonFree/getStudyUrl",
            type: 'post',
            data: {id: itemId, cid: courseId, cMId : courseModuleId},
            dataType: 'json',
            success: function (r) {
                if (r.success) {
                    var iframe = '<iframe class="course_lesson_free_iframe" id="course_lesson_iframe" src="' + r.data.url + '" width="100%" frameBorder="0">Browser not compatible.</iframe>';
                    that.showLessonIframe(iframe);
                } else {
                    that.showErrorMessage(r.message);
                }
            }
        });
    };

    var viewDocument = function(documentId, event) {
        event.preventDefault();
        var me = $(event.target);
        $(".tab_panel.active .dropdown_item_hoclieu").removeClass('active');
        me.parents('.dropdown_item_hoclieu').addClass('active');

        var courseId = this.courseId;
        var that = this;
        $.ajax({
            url: "/module/lms/service/documentUsage/getViewUrl",
            type: 'post',
            data: {id: documentId, cid: courseId},
            dataType: 'json',
            success: function (r) {
                if (r.success && r.data.url) {
                    var iframe = '<iframe id="course_lesson_iframe" src="' + r.data.url + '" width="100%" frameBorder="0">Browser not compatible.</iframe>';
                    that.showLessonIframe(iframe);
                } else {
                    that.showErrorMessage(r.message);
                }
            }
        });
    };

    var viewHomework = function (itemId, e) {
        var courseModuleId = this.courseModuleId;
        var courseId = this.courseId;
        var that = this;

        $.ajax({
            url: "/module/lms/service/homework/getViewUrl",
            type: 'post',
            data: {id: itemId, cid: courseId, cMId : courseModuleId},
            dataType: 'json',
            success: function (r) {
                if (r.success && r.data.url) {
                    var iframe = '<iframe id="course_lesson_iframe" src="'+r.data.url+'" width="100%" frameBorder="0">Browser not compatible.</iframe>';
                    that.showLessonIframe(iframe);
                } else {
                    that.showErrorMessage(r.message);
                }
            }
        });
    };

    var studyQuiz = function(itemId, e){
        var courseId = this.courseId;
        var that = this;
        $.ajax({
            url: "/module/lms/service/courseQuiz/getStudyUrl",
            type: 'post',
            data: {id: itemId, cid: courseId},
            dataType: 'json',
            success: function (r) {
                if (r.success && r.url) {
                    var styleClass = Course.isSmallScreen ? 'course enjoin_course' : 'course enjoin_course xs_workspace';
                    $('#enjoin-course-outer').attr('class', styleClass);
                    var lessonHeight = that.courseLessonElm.height();
                    if(lessonHeight <= 0) {
                        lessonHeight = 500;
                    }
                    that.courseLessonElm.html('<iframe class="course_lesson_quiz_iframe" id="course_lesson_iframe" src="'+r.url+'" width="100%" height="'+lessonHeight+'" frameBorder="0">Browser not compatible.</iframe>');
                } else {
                    App.showMessageWarning(r.message);
                }
            }
        });
    };

    var studySurvey = function(itemId, e){
        var courseId = this.courseId;
        var that = this;
        $.ajax({
            url: "/module/lms/service/courseSurvey/getStudyUrl",
            type: 'post',
            data: {id: itemId, cid: courseId},
            dataType: 'json',
            success: function (r) {
                if (r.success && r.url) {
                    var styleClass = Course.isSmallScreen ? 'course enjoin_course' : 'course enjoin_course xs_workspace';
                    $('#enjoin-course-outer').attr('class', styleClass);
                    var lessonHeight = that.courseLessonElm.height();
                    if(lessonHeight <= 0) {
                        lessonHeight = 500;
                    }
                    that.courseLessonElm.html('<iframe class="course_lesson_quiz_iframe" id="course_lesson_iframe" src="'+r.url+'" width="100%" height="'+lessonHeight+'" frameBorder="0">Browser not compatible.</iframe>');
                } else {
                    App.showMessageWarning(r.message);
                }
            }
        });
    };

    /* truongbt @todo begin canvas */
    var studyCanvas = function (itemId, e) {
        var courseModuleId = this.courseModuleId;
        var courseId = this.courseId;
        var that = this;

        $.ajax({
            url: "/module/lms/service/lessonCanvas/getStudyUrl",
            type: 'post',
            data: {id: itemId, cid: courseId, cMId : courseModuleId},
            dataType: 'json',
            success: function (r) {
                if (r.success) {
                    var styleClass = Course.isSmallScreen ? 'course enjoin_course' : 'course enjoin_course md_workspace';
                    $('#enjoin-course-outer').attr('class', styleClass);
                    var lessonHeight = that.courseLessonElm.height();
                    if(lessonHeight <= 0) {
                        lessonHeight = 500;
                    }
                    that.courseLessonElm.html('<iframe class="course_lesson_free_iframe" id="course_lesson_iframe" src="' + r.data.url + '" width="100%" height="'+lessonHeight+'" frameBorder="0">Browser not compatible.</iframe>');
                } else {
                    App.showMessageWarning(r.message);
                }
            }
        });
    };

    var studyLessonYoutubeStreaming = function (itemId, e) {
        var iframe = '<iframe src="/module/lms/lessonYoutubeStreaming/viewStream?id='+itemId+'" width="100%" frameBorder="0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen >Browser not compatible.</iframe>';
        this.showLessonIframe(iframe);
    }

    var studyLessonZoom = function(itemId, e) {
        var courseModuleId = this.courseModuleId;
        var courseId = this.courseId;
        var that = this;

        $.ajax({
            url: "/module/lmsCourse/service/lessonZoom/getStudyUrl",
            type: 'post',
            data: {id: itemId, cid: courseId, cMId : courseModuleId},
            dataType: 'json',
            success: function (r) {
                if (r.success) {
                    var iframeElm = '<iframe class="course_lesson_zoom_iframe" loading" allow="microphone; camera"' +
                        ' sandbox="allow-popups allow-forms allow-scripts allow-same-origin allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation" ' +
                        ' id="course_lesson_iframe" src="' + r.data.url + '" width="100%" frameBorder="0">Browser not compatible.</iframe>';

                    that.showLessonIframe(iframeElm, 'lesson_zoom');
                } else {
                    that.showErrorMessage(errorMsg);
                }
            }
        });
    };

    var studyLessonWebex = function(itemId, e) {
        var courseModuleId = this.courseModuleId;
        var courseId = this.courseId;
        var that = this;

        $.ajax({
            url: "/module/lmsCourse/service/lessonWebex/getStudyUrl",
            type: 'post',
            data: {id: itemId, cid: courseId, cMId : courseModuleId},
            dataType: 'json',
            success: function (r) {
                if (r.success) {
                    var iframeElm = '<iframe class="course_lesson_webex_iframe" loading" allow="microphone; camera"' +
                        ' sandbox="allow-popups allow-forms allow-scripts allow-same-origin allow-popups-to-escape-sandbox" ' +
                        ' id="course_lesson_iframe" src="' + r.data.url + '" width="100%" frameBorder="0">Browser not compatible.</iframe>';

                    that.showLessonIframe(iframeElm, 'lesson_webex');
                } else {
                    that.showErrorMessage(errorMsg);
                }
            }
        });
    };

    var studyLessonGoogleMeet = function(itemId, e) {
        var courseModuleId = this.courseModuleId;
        var courseId = this.courseId;
        var that = this;

        $.ajax({
            url: "/module/lmsCourse/service/lessonGoogleMeet/getStudyUrl",
            type: 'post',
            data: {id: itemId, cid: courseId, cMId : courseModuleId},
            dataType: 'json',
            success: function (r) {
                if (r.success) {
                    var iframeElm = '<iframe class="course_lesson_googlemeet_iframe" loading" allow="microphone; camera"' +
                        ' sandbox="allow-popups allow-forms allow-scripts allow-same-origin allow-popups-to-escape-sandbox" ' +
                        ' id="course_lesson_iframe" src="' + r.data.url + '" width="100%" frameBorder="0">Browser not compatible.</iframe>';

                    that.showLessonIframe(iframeElm, 'lesson_google_meet');
                } else {
                    that.showErrorMessage(errorMsg);
                }
            }
        });
    };

    var studyLessonMicrosoft = function(itemId, e) {
        var courseModuleId = this.courseModuleId;
        var courseId = this.courseId;
        var that = this;

        $.ajax({
            url: "/module/lmsCourse/service/lessonMSTeam/getStudyUrl",
            type: 'post',
            data: {id: itemId, cid: courseId, cMId : courseModuleId},
            dataType: 'json',
            success: function (r) {
                if (r.success) {
                    var iframeElm = '<iframe class="course_lesson_zoom_iframe" loading" allow="microphone; camera"' +
                        ' sandbox="allow-popups allow-forms allow-scripts allow-same-origin allow-popups-to-escape-sandbox" ' +
                        ' id="course_lesson_iframe" src="' + r.data.url + '" width="100%" frameBorder="0">Browser not compatible.</iframe>';

                    that.showLessonIframe(iframeElm, 'lesson_zoom');
                } else {
                    that.showErrorMessage(errorMsg);
                }
            }
        });
    };
    /* tài liệu học tập*/
    var courseTaiLieu = function (courseId) {
        var that = this;

        // Ẩn welcome
        $('#course_lesson_welcome').hide();
        $('.tracking-item.welcomeCourse').removeClass('active');
        $('.tracking-item.hocLieuItem').removeClass('active');
        $('.tracking-item.summaryCourse').removeClass('active');

        $('.tailieuCourse').addClass('active');
        /*Ẩn menu course*/
        if($('.mobile .outer-enjoin').hasClass('active')) {
            $('.mobile .outer-enjoin').slideUp("slow");
            $('html,body').css({
                'height':'auto',
                'overflow':'initial'
            });
            var clsIcon = $('.super_container.mobile .toggle-menu-mobile').find('i').attr('class');
            if(clsIcon == 'fa fa-bars') {
                $('.super_container.mobile .toggle-menu-mobile').find('i').attr('class', 'fa fa-times');
            }else if(clsIcon == 'fa fa-times') {
                $('.super_container.mobile .toggle-menu-mobile').find('i').attr('class', 'fa fa-bars');
            }
            //$('.mobile .outer-enjoin').toggleClass('active');
        }

        var userId = AppCfg.user.id;
        var errors = false;
        if(userId == '' || userId == null || userId == 'undefined') {
            errors = true;
            this.showErrorMessage('Lỗi thiếu tham số ID học viên');
        }
        if(courseId == '' || courseId == null || courseId == 'undefined') {
            errors = true;
            this.showErrorMessage('Lỗi thiếu tham số ID khóa học');
        }

        that.isShowLoading = false;
        that.showLoadingMessage();

        var iframe = '<iframe id="course_lesson_iframe" src="/module/etepLmsCourse/courseStudent/showTaiLieu?course_id='+courseId+'" width="100%" frameBorder="0">Browser not compatible.</iframe>';
        that.showLessonIframe(iframe);
    };
    /* Tổng kết khóa học*/
    var courseSummary = function(courseId) {
        var that = this;

        // Ẩn welcome
        $('#course_lesson_welcome').hide();
        $('.tracking-item.welcomeCourse').removeClass('active');

        /*Ẩn menu course*/
        if($('.mobile .outer-enjoin').hasClass('active')) {
            $('.mobile .outer-enjoin').slideUp("slow");
            $('html,body').css({
                'height':'auto',
                'overflow':'initial'
            });
            var clsIcon = $('.super_container.mobile .toggle-menu-mobile').find('i').attr('class');
            if(clsIcon == 'fa fa-bars') {
                $('.super_container.mobile .toggle-menu-mobile').find('i').attr('class', 'fa fa-times');
            }else if(clsIcon == 'fa fa-times') {
                $('.super_container.mobile .toggle-menu-mobile').find('i').attr('class', 'fa fa-bars');
            }
            //$('.mobile .outer-enjoin').toggleClass('active');
        }

        var userId = AppCfg.user.id;
        var errors = false;
        if(userId == '' || userId == null || userId == 'undefined') {
            errors = true;
            this.showErrorMessage('Lỗi thiếu tham số ID học viên');
        }
        if(courseId == '' || courseId == null || courseId == 'undefined') {
            errors = true;
            this.showErrorMessage('Lỗi thiếu tham số ID khóa học');
        }

        that.isShowLoading = false;
        that.showLoadingMessage();

        if(errors === false) {
            $.post('/module/lms/service/courseStudent/getCourseSummary', { courseId : courseId, userId : userId}, function(req) {
                if(req.success) {
                    var iframe = '<iframe id="course_lesson_iframe" src="' + req.data.url + '" width="100%" frameBorder="0">Browser not compatible.</iframe>';
                    that.showLessonIframe(iframe);
                }else {
                    App.showMessageWarning(req.message);
                }
            });
        }
    };

    var initLessonDocumentModal = function(documentIds, e){
        new jBox('Modal', {
            attach: '#btn_course_lesson_modal_documents',
            width: 220,
            title: 'jBox',
            overlay: false,
            content: 'Drag me around by using the title',
            draggable: 'title',
            repositionOnOpen: false,
            repositionOnContent: false
        });

    };

    var welcome = function() {

        // Ẩn tab lesson comment
        $(".course_tabs_container #tab_lesson_comment").hide();

        // Ẩn học liệu hiện tại
        this.courseLessonElm.html('');
        this.courseSectionElm.find('.hocLieuItem').removeClass('active');

        /*Ẩn menu course*/
        if($('.mobile .outer-enjoin').hasClass('active')) {
            $('.mobile .outer-enjoin').slideUp("slow");
            $('html,body').css({
                'height':'auto',
                'overflow':'initial'
            });
            var clsIcon = $('.super_container.mobile .toggle-menu-mobile').find('i').attr('class');
            if(clsIcon == 'fa fa-bars') {
                $('.super_container.mobile .toggle-menu-mobile').find('i').attr('class', 'fa fa-times');
            }else if(clsIcon == 'fa fa-times') {
                $('.super_container.mobile .toggle-menu-mobile').find('i').attr('class', 'fa fa-bars');
            }
            //$('.mobile .outer-enjoin').toggleClass('active');
        }

        // hiện welcome
        $('.tracking-item.welcomeCourse').addClass('active');
        $('#course_lesson_welcome').show();
    };

    var welcomebj = function() {
        $('.item_hoclieu_title.first_hoc_lieu').trigger('click');
    };

    if($(window).width() < 767){
        $('.mobile .outer-enjoin').css({
            'max-height':($(window).height() - 90 - 100)+'px'
        });
    }

    var fillPaths = [
        'M256,256 L256,6 A250,250 1 0,1 256,6 z',
        'M256,256 L256,6 A250,250 1 0,1 271.7,6.49 z',
        'M256,256 L256,6 A250,250 1 0,1 287.33,7.97 z',
        'M256,256 L256,6 A250,250 1 0,1 302.85,10.43 z',
        'M256,256 L256,6 A250,250 1 0,1 318.17,13.85 z',
        'M256,256 L256,6 A250,250 1 0,1 333.25,18.24 z',
        'M256,256 L256,6 A250,250 1 0,1 348.03,23.56 z',
        'M256,256 L256,6 A250,250 1 0,1 362.44,29.79 z',
        'M256,256 L256,6 A250,250 1 0,1 376.44,36.92 z',
        'M256,256 L256,6 A250,250 1 0,1 389.96,44.92 z',
        'M256,256 L256,6 A250,250 1 0,1 402.95,53.75 z',
        'M256,256 L256,6 A250,250 1 0,1 415.36,63.37 z',
        'M256,256 L256,6 A250,250 1 0,1 427.14,73.76 z',
        'M256,256 L256,6 A250,250 1 0,1 438.24,84.86 z',
        'M256,256 L256,6 A250,250 1 0,1 448.63,96.64 z',
        'M256,256 L256,6 A250,250 1 0,1 458.25,109.05 z',
        'M256,256 L256,6 A250,250 1 0,1 467.08,122.04 z',
        'M256,256 L256,6 A250,250 1 0,1 475.08,135.56 z',
        'M256,256 L256,6 A250,250 1 0,1 482.21,149.56 z',
        'M256,256 L256,6 A250,250 1 0,1 488.44,163.97 z',
        'M256,256 L256,6 A250,250 1 0,1 493.76,178.75 z',
        'M256,256 L256,6 A250,250 1 0,1 498.15,193.83 z',
        'M256,256 L256,6 A250,250 1 0,1 501.57,209.15 z',
        'M256,256 L256,6 A250,250 1 0,1 504.03,224.67 z',
        'M256,256 L256,6 A250,250 1 0,1 505.51,240.3 z',
        'M256,256 L256,6 A250,250 1 0,1 506,256 z',
        'M256,256 L256,6 A250,250 1 0,1 505.51,271.7 z',
        'M256,256 L256,6 A250,250 1 0,1 504.03,287.33 z',
        'M256,256 L256,6 A250,250 1 0,1 501.57,302.85 z',
        'M256,256 L256,6 A250,250 1 0,1 498.15,318.17 z',
        'M256,256 L256,6 A250,250 1 0,1 493.76,333.25 z',
        'M256,256 L256,6 A250,250 1 0,1 488.44,348.03 z',
        'M256,256 L256,6 A250,250 1 0,1 482.21,362.44 z',
        'M256,256 L256,6 A250,250 1 0,1 475.08,376.44 z',
        'M256,256 L256,6 A250,250 1 0,1 467.08,389.96 z',
        'M256,256 L256,6 A250,250 1 0,1 458.25,402.95 z',
        'M256,256 L256,6 A250,250 1 0,1 448.63,415.36 z',
        'M256,256 L256,6 A250,250 1 0,1 438.24,427.14 z',
        'M256,256 L256,6 A250,250 1 0,1 427.14,438.24 z',
        'M256,256 L256,6 A250,250 1 0,1 415.36,448.63 z',
        'M256,256 L256,6 A250,250 1 0,1 402.95,458.25 z',
        'M256,256 L256,6 A250,250 1 0,1 389.96,467.08 z',
        'M256,256 L256,6 A250,250 1 0,1 376.44,475.08 z',
        'M256,256 L256,6 A250,250 1 0,1 362.44,482.21 z',
        'M256,256 L256,6 A250,250 1 0,1 348.03,488.44 z',
        'M256,256 L256,6 A250,250 1 0,1 333.25,493.76 z',
        'M256,256 L256,6 A250,250 1 0,1 318.17,498.15 z',
        'M256,256 L256,6 A250,250 1 0,1 302.85,501.57 z',
        'M256,256 L256,6 A250,250 1 0,1 287.33,504.03 z',
        'M256,256 L256,6 A250,250 1 0,1 271.7,505.51 z',
        'M256,256 L256,6 A250,250 1 0,1 256,506 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 240.3,505.51 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 224.67,504.03 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 209.15,501.57 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 193.83,498.15 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 178.75,493.76 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 163.97,488.44 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 149.56,482.21 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 135.56,475.08 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 122.04,467.08 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 109.05,458.25 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 96.64,448.63 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 84.86,438.24 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 73.76,427.14 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 63.37,415.36 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 53.75,402.95 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 44.92,389.96 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 36.92,376.44 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 29.79,362.44 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 23.56,348.03 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 18.24,333.25 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 13.85,318.17 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 10.43,302.85 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 7.97,287.33 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 6.49,271.7 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 6,256 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 6.49,240.3 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 7.97,224.67 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 10.43,209.15 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 13.85,193.83 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 18.24,178.75 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 23.56,163.97 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 29.79,149.56 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 36.92,135.56 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 44.92,122.04 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 53.75,109.05 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 63.37,96.64 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 73.76,84.86 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 84.86,73.76 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 96.64,63.37 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 109.05,53.75 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 122.04,44.92 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 135.56,36.92 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 149.56,29.79 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 163.97,23.56 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 178.75,18.24 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 193.83,13.85 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 209.15,10.43 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 224.67,7.97 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 240.3,6.49 z',
        'M256,256 L256,6 A250,250 1 0,1 256, 506 A250,250 1 0,1 256,6 z'
    ];

    var lessonChangeProgress = function(data) {
        if(data === false){
            return;
        }

        if(!fillPaths[data]){
            return;
        }
        $('#tracking-item-' + this.currentLessonId).find('.svg-inline').find('path').attr('d', fillPaths[data]);
        if(data >=100){
            $('#tracking-item-' + this.currentLessonId).find('.icon-progress').removeClass('not-done').addClass('done');
        }
    };

    var enableLesson = function(data) {
        if(data === false){
            return;
        }
        var currentIndex = $('#tracking-item-' + this.currentLessonId).attr('data-index');
        var currentIndexSection = $('#tracking-item-' + this.currentLessonId).attr('data-index-section');
        var lastSection = $('#tracking-item-' + this.currentLessonId).attr('data-last-section');

        // Nếu học liệu là cuối chuyên đề => mở học liệu đầu tiên của chương mục tiếp theo
        if(lastSection == 'true') {
            $('.tracking-section-' + (parseInt(currentIndexSection) + 1) + ' .tracking-item-first').removeClass( "disabled");
        }

        $('#tracking-item-' + this.currentLessonId).parents('.tracking-list').find("[data-index = " + (parseInt(currentIndex) + 1) + "]").removeClass( "disabled");
    };

    $(window).resize(function(){
        if(Course.courseLessonElm){
            resizeWindow();
        }
    });

    // var studyLesson = function(itemId, itemModuleId, me, reset)
    var loadVirtualClassroom = function (classRoomLink, browserName, userFullName, roomType, openMobileLink = 0, currentTiet='') {
        var that = this;
        $('#course_lesson_welcome').hide();
        if (roomType == 1) {
            var zoomLinkInfo = classRoomLink.split("?pwd=");

            var zoomId = classRoomLink.split('/').pop().split('?').shift();
            var zoomPwd = zoomLinkInfo.length > 1 ? zoomLinkInfo[1] : '';
            var lessonZoomMobileAppUrl = "zoomus://zoom.us/join?confno=" + zoomId + (zoomPwd.length ? ("&pwd=" + zoomPwd) : "") +
                "&zc=0&browser=" + browserName + "&uname=" + userFullName;
            var lessonZoomDesktopAppUrl = "zoommtg://zoom.us/join?confno=" + zoomId + (zoomPwd.length ? ("&pwd=" + zoomPwd) : "") +
                "&zc=0&browser=" + browserName + "&uname=" + userFullName;

            if (openMobileLink) {
                window.open(lessonZoomMobileAppUrl)
            } else {
                window.open(lessonZoomDesktopAppUrl)
            }
        }
        if (roomType == 2) {
            window.open(classRoomLink)
        }
        // log activity open modal
        if(typeof currentTiet.booking_date_old !== 'undefined' && typeof currentTiet.tiet_hoc_old !== 'undefined') {
            currentTiet.booking_date = currentTiet.booking_date_old;
            currentTiet.tiet_hoc = currentTiet.tiet_hoc_old;
        }
        if(typeof currentTiet.classroom_id !== 'undefined') {
            currentTiet.room_id = currentTiet.classroom_id;
        }
        $.post('/module/virtualClassroom/service/booking/logActivity', {
            data: currentTiet,
            action: 2
        }, function () {});

        // var lessonHeight = $('#course_lesson_content').height();
        // that.courseLessonElm.html('<iframe class="course_lesson_scorm_iframe" id="course_lesson_iframe" ' +
        //     'src="'+classRoomLink+'" width="100%" height="'+lessonHeight+'" frameBorder="0">Browser not compatible.</iframe>');

        return;
    };

    return {
        isShowLoading: false,
        isSmallScreen: isSmallScreen,
        courseModuleId: courseModuleId,
        courseId: courseId,
        courseSectionElm: courseSectionElm,
        courseLessonElm: courseLessonElm,
        currentLessonId: currentLessonId,
        enrolStudent: enrolStudent,
        cancelEnrolStudent: cancelEnrolStudent,
        enjoinStudent: enjoinStudent,
        initStudyCourse: initStudyCourse,
        studyLesson: studyLesson,
        studyLessonScorm: studyLessonScorm,
        studyLessonPresentation: studyLessonPresentation,
        studyLessonVideo: studyLessonVideo,
        studyLessonVideoEmbed: studyLessonVideoEmbed,
        studyLessonFree: studyLessonFree,
        viewHomework: viewHomework,
        viewDocument: viewDocument,
        studyQuiz: studyQuiz,
        studySurvey: studySurvey,
        studyCanvas : studyCanvas,
        studyLessonYoutubeStreaming: studyLessonYoutubeStreaming,
        studyLessonZoom : studyLessonZoom,
        studyLessonMicrosoft : studyLessonMicrosoft,
        studyLessonWebex : studyLessonWebex,
        studyLessonGoogleMeet : studyLessonGoogleMeet,
        initLessonDocumentModal: initLessonDocumentModal,
        welcome : welcome,
        lessonChangeProgress : lessonChangeProgress,
        enableLesson : enableLesson,
        courseSummary : courseSummary,
        setCurrentLesson: setCurrentLesson,
        showErrorMessage: showErrorMessage,
        showLoadingMessage: showLoadingMessage,
        showLessonIframe: showLessonIframe,
        fillPaths: fillPaths,
        loadVirtualClassroom : loadVirtualClassroom,
    };

}();

$(document).on('click', '.btn.cancelEnrolStudent', function(event){
    event.stopImmediatePropagation();
    var courseId = $(event.target).attr('data-course-id');
    Course.cancelEnrolStudent(courseId, event);
});
$(document).on('click', '.tracking-item .class-toggle', function(e){
    e.preventDefault();
    $(this).closest('.tracking-item').toggleClass('open');
    var panel = $(this).closest('.tracking-container');
    panel.css('max-height', panel.prop('scrollHeight') + "px");
});
