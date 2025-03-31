import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarbleDiagramComponent } from './marble-diagram.component';

describe('MarbleDiagramComponent', () => {
  let component: MarbleDiagramComponent;
  let fixture: ComponentFixture<MarbleDiagramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarbleDiagramComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarbleDiagramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
