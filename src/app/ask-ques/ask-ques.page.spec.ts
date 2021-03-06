import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AskQuesPage } from './ask-ques.page';

describe('AskQuesPage', () => {
  let component: AskQuesPage;
  let fixture: ComponentFixture<AskQuesPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AskQuesPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AskQuesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
