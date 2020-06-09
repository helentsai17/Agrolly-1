import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { Language } from '../language/language';
import { FCM } from '@ionic-native/fcm/ngx';


@Injectable({
  providedIn: 'root'
})
export class HttpcallsService {
  // for login, register and logout
  name: string;
  email: string;
  id: string;
  password: string;

  // change tabs based on login
  showHomeTab = true;
  showLoginTab = true;
  showRegisterTab = true;
  showMyQuestionsTab = false;
  showAskQuestionsTab = false;
  showFrm1Tab = false;
  loggedIn = false;

  // for forum or misc or off topic questions
  forumList: any;

  // for my questions list
  userQuesList: any;

  // when you click on a question in the list
  commentList: any;
  completeQues: any;

  // for subjective list of questions
  topicList: any;
  topicList2: any;
  subjectSelected: string;
  subjectQuestionList: any;


  // Language lists
  languageList: any;


  // tslint:disable-next-line: max-line-length
  constructor(private http: HttpClient, private route: Router, private Toast: ToastController, private storage: Storage, private screenOrientation: ScreenOrientation, private lang: Language,
              private fcm: FCM) {
    this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);

    this.languageList = this.lang.English[0];
    storage.get('language').then((val) => {
      if (val === 'Mongolian') {
        this.languageList = this.lang.Mongolian[0];
      } else if (val === 'Portuguese') {
        this.languageList = this.lang.Portuguese[0];
      } else {
        this.languageList = this.lang.English[0];
      }
    });

    // Or to get a key/value pair
    storage.get('id').then((val) => {
      if (val !== '' && val !== null && val !== undefined) {
        this.id = val;
        this.GetUserQuestions(); // call when login available
        // console.log("id is:" + this.id);
      } else {
        storage.remove('id');
      }
    });

    storage.get('email').then((val) => {
      if (val !== '' && val !== null && val !== undefined) {
        this.loggedIn = true;
        this.showLoginTab = false;
        this.showRegisterTab = false;
        this.showMyQuestionsTab = true;
        this.showAskQuestionsTab = true;
        this.email = val;
      } else {
        storage.remove('email');
      }
    });

    storage.get('name').then((val) => {
      if (val !== '' && val !== null && val !== undefined) {
        this.name = val;
        // console.log("name is:" + this.name);
      } else {
        storage.remove('name');
      }
    });


    /*********** firebase cloud messaging ****************/

    this.initFireBase();

    /**************** FCM *****************************/

    this.GetTopics();
    this.GetTopics2();
    this.GetForumQuestions();
  }

  httpOptionsGet = {
    headers: new HttpHeaders({
      'Content-type': 'text/html',
    })
  };

  httpOptionsPost = {
    headers: new HttpHeaders({
      'Content-type': 'application/x-www-form-urlencoded', // 'application/json', try different formats if you keep receiving error
    })
  };

  /* Notifications */
  initFireBase() {
    this.fcm.getToken().then(token => {
      this.setToken(token);
      console.log(token);
    });

    this.fcm.onTokenRefresh().subscribe(token => {
      console.log(token);
    });

    this.fcm.onNotification().subscribe(data => {
      console.log(data);
      if (data.wasTapped) {
        console.log('Received in background');
      } else {
        console.log('Received in foreground');
      }
    });
  }

  setToken(token: string) {
    this.checkLogin();
    const postData = {
      uid: this.id,
      utoken: token,
      type: 'setToken',
    };
    if (this.loggedIn && (this.id !== null || this.id !== undefined)) {
      this.http.post('http://agrolly.tech/notify.php', postData, this.httpOptionsPost).subscribe(
        (result) => {
          console.log('Result is:' + result['result']);
          if (result['result'] === 'successful') {
            console.log('Successful');
          } else {
            console.log('unuccessful');
          }
        }
      );
    }
  }

  removeTokenOnLogout() {
    const postData = {
      uid: this.id,
      type: 'unsetToken',
    };
    this.http.post('http://agrolly.tech/notify.php', postData, this.httpOptionsPost).subscribe(
      (result) => {
        console.log('Result is:' + result['result']);
        if (result['result'] === 'successful') {
          console.log('Successful');
        } else {
          console.log('unsuccessful');
        }
      }
    );
  }


  /* Language List */
  languageChange() {
    return new Observable(observer => {
      observer.next(this.languageList);
    });
  }

  /* Login methods */

  checkLogin() {
    return new Observable(observer => {
      observer.next(this.loggedIn);
    });
  }

  GetLogin(email, password) {
    const postData = {
      useremail: email,
      userpassword: password
    };
    this.http.post('http://agrolly.tech/login.php', postData, this.httpOptionsPost).subscribe(
      (result) => {
        if (result['result'] === 'successful') {
          // console.log(result);
          this.showLoginTab = false;
          this.showRegisterTab = false;
          this.showMyQuestionsTab = true;
          this.showAskQuestionsTab = true;
          this.loggedIn = true;
          this.route.navigateByUrl('');
          this.name = result['name'];
          this.id = result['user_id'];
          this.email = email;
          this.LoginToast();
          this.storage.set('email', email);
          this.storage.set('name', this.name);
          this.storage.set('id', this.id);
          this.GetUserQuestions();
          this.initFireBase();
        } else {
          // console.log(result);
          this.LoginFailed();
          this.showHomeTab = true;
          this.showLoginTab = true;
          this.showRegisterTab = true;
          this.showMyQuestionsTab = false;
          this.showAskQuestionsTab = false;
          this.showFrm1Tab = false;
          this.loggedIn = false;
        }
      });
  }


  Logout() {
    this.removeTokenOnLogout();
    this.loggedIn = false;
    this.showHomeTab = true;
    this.showLoginTab = true;
    this.showRegisterTab = true;
    this.showMyQuestionsTab = false;
    this.showAskQuestionsTab = false;
    this.showFrm1Tab = false;
    this.loggedIn = false;
    this.storage.remove('email');
    this.storage.remove('name');
    this.storage.remove('id');
    this.name = undefined;
    this.id = undefined;
    this.email = undefined;
    this.LogoutToast();
  }

  async LoginToast() {
    const toast = await this.Toast.create({
      message: this.languageList.login_successful_message,
      duration: 2000,
      position: 'top',
      translucent: true
    });
    toast.present();
  }

  async LoginFailed() {
    const toast = await this.Toast.create({
      message: this.languageList.login_failed_message,
      duration: 2000,
      position: 'top',
      translucent: true
    });
    toast.present();
  }

  async LogoutToast() {
    const toast = await this.Toast.create({
      message: this.languageList.logout_message,
      duration: 2000,
      position: 'top',
      translucent: true
    });
    toast.present();
  }
  /* Register User */
  register(email: string, password: string, name: string, country: string, state: string) {
    const postData = {
      useremail: email,
      userpassword: password,
      username: name,
      usercountry: country,
      userstate: state,
    };
    this.http.post('http://agrolly.tech/register.php', postData, this.httpOptionsPost).subscribe(
      (result) => {
        if (result['result'] === 'successful') {
          this.route.navigateByUrl('/tabs/tab2');
          this.registerSuccessful();
        } else {
          this.registerFailed();
          this.route.navigateByUrl('/tabs/tab3');
        }
      });
  }

  async registerSuccessful() {
    const toast = await this.Toast.create({
      message: this.languageList.registeration_successful_message,
      duration: 2000,
      position: 'top',
      translucent: true
    });
    toast.present();
  }

  async registerFailed() {
    const toast = await this.Toast.create({
      message: this.languageList.registeration_failed_message,
      duration: 2000,
      position: 'top',
      translucent: true
    });
    toast.present();
  }


  /* Forgot Password */
  forgotPassword(email: string, password: string) {
    const postData = {
      useremail: email,
      userpassword: password
    };
    this.http.post('http://agrolly.tech/forgotpassword.php', postData, this.httpOptionsPost).subscribe(
      (result) => {
        if (result['result'] === 'successful') {
          this.route.navigateByUrl('/tabs/tab2');
          this.passwordChanged();
        } else {
          this.route.navigateByUrl('/tabs/tab3');
          this.passwordChangefailed();
        }
      });
  }

  async passwordChanged() {
    const toast = await this.Toast.create({
      message: this.languageList.password_changed_success,
      duration: 2000,
      position: 'top',
      translucent: true
    });
    toast.present();
  }

  async passwordChangefailed() {
    const toast = await this.Toast.create({
      message: this.languageList.password_changed_failed,
      duration: 2000,
      position: 'top',
      translucent: true
    });
    toast.present();
  }

  /* Request One time password */
  requestOtp(otp, email) {
    // tslint:disable-next-line: max-line-length
    const postData = {
      useremail: email,
      onetimepassword: otp
    };
    this.http.post('http://agrolly.tech/mail.php', postData, this.httpOptionsPost).subscribe(
      (result) => {
        console.log(result);
      });
  }

  /* Load topics for practice questions */

  GetTopics() {
    this.http.get('http://caokumtech.com/topics.php', this.httpOptionsGet).subscribe(
      (result) => {
        this.topicList = result;
      });
  }

  GetTopics2() {
    this.http.get('http://caokumtech.com/topics2.php', this.httpOptionsGet).subscribe(
      (result) => {
        this.topicList2 = result;
      });
  }

  /* Ask Questions Page */
  post_question(question: string, imageName: string) {
    if (this.name !== 'null' || this.name !== undefined) {
      const postQuesData = {
        postquestion: question,
        postuid: this.id,
        postname: this.name,
        postFile: imageName
      };

      this.http.post('http://agrolly.tech/submitquestion.php', postQuesData, this.httpOptionsPost).subscribe(
        (result) => {
          if (result['result'] === 'successful') {
            this.quesPostSuccessful();
          } else {
            this.quesPostFailed();
          }
        });
    }
  }

  async quesPostSuccessful() {
    const toast = await this.Toast.create({
      message: this.languageList.question_post_success,
      duration: 2000,
      position: 'top',
      translucent: true
    });
    toast.present();
  }

  async quesPostFailed() {
    const toast = await this.Toast.create({
      message: this.languageList.question_post_failed,
      duration: 2000,
      position: 'top',
      translucent: true
    });
    toast.present();
  }

  /* Get Forum Questions */
  GetForumQuestions() {
    this.http.get('http://agrolly.tech/forum.php', this.httpOptionsGet).subscribe(
      (result) => {
        this.forumList = result;
      });
  }

  /* Get User Questions */
  GetUserQuestions() {
    if (this.name !== 'null' || this.name !== undefined) {
      const postQuesData = {
        uid: this.id
      };
      this.http.post('http://agrolly.tech/myquestions.php', postQuesData, this.httpOptionsPost).subscribe(
        (result) => {
          this.userQuesList = result;
          // console.log(result);
        });
    }
  }
  /* Load Questions and Comments */
  getQuestion(id) {
    this.http.get('http://agrolly.tech/quesComm.php?what=question&id=' + id, this.httpOptionsGet).subscribe(
      (result) => {
        this.completeQues = result;
      });
  }

  getComments(id) {
    this.http.get('http://agrolly.tech/quesComm.php?what=comment&id=' + id, this.httpOptionsGet).subscribe(
      (result) => {
        this.commentList = result;
      });
  }

  postAnswer(answer: string, Qid: string, imageFileName: string) {
    const postQuesData = {
      uid: this.id,
      name: this.name,
      text: answer,
      qid: Qid,
      filename: imageFileName
    };
    this.http.post('http://agrolly.tech/postAnswer.php', postQuesData, this.httpOptionsPost).subscribe(
      (result) => {
        console.log(result['user_id']);
        console.log(result['token']);
        if (result['result'] === 'successful') {
          this.commentPostSuccessful();
        } else {
          this.commentPostFailed();
        }
      });
  }

  async commentPostSuccessful() {
    const toast = await this.Toast.create({
      message: this.languageList.comment_post_successful,
      duration: 2000,
      position: 'top',
      translucent: true
    });
    toast.present();
  }

  async commentPostFailed() {
    const toast = await this.Toast.create({
      message: this.languageList.comment_post_failed,
      duration: 2000,
      position: 'top',
      translucent: true
    });
    toast.present();
  }


  /* Load questions subject wise */
  GetSubjectQuestions() {
    this.http.get('http://caokumtech.com/subjectQuestions.php?subject=' + this.subjectSelected, this.httpOptionsGet).subscribe(
      (result) => {
        this.subjectQuestionList = result;
      });
  }
}