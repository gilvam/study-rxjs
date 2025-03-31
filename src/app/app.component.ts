import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { MarbleDiagramComponent } from "./components/marble-diagram/marble-diagram.component";

@Component({
	selector: "app-root",
	imports: [CommonModule, FormsModule, MarbleDiagramComponent],
	standalone: true,
	templateUrl: `./app.component.html`,
	styleUrls: [`./app.component.scss`]
})
export class AppComponent {}
