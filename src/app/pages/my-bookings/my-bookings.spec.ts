import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MyBookings } from './my-bookings';

describe('MyBookings', () => {
  let component: MyBookings;
  let fixture: ComponentFixture<MyBookings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyBookings],
      providers: [provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyBookings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
