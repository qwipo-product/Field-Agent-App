import { WebViewComponent } from './pages/account/web-view/web-view';
import { HopsListComponent } from './pages/delivery/hops-list/hops-list';
import { TripsListComponent } from './pages/delivery/trips-list/trips-list';
import { Routes } from "@angular/router";
import { MobileNumberComponent } from "./pages/auth/mobile-number/mobile-number.component";
import { MobileOTPComponent } from "./pages/auth/mobile-otp/mobile-otp-component";
import { AppVersionCheckComponent } from "./pages/auth/app-version-check/app-version-check.component";
import { GreetingsComponent } from "./pages/auth/greeting/greeting.component";
import { LoginComponent } from "./pages/auth/login/login";
import { HopDetailsComponent } from './pages/delivery/hop-details/hop-details';
import { TripDetailsComponent } from './pages/delivery/trip-details/trip-details';
import { MyInfoComponent } from './pages/account/my-info/my-info';
import { ProfileComponent } from './pages/account/profile/profile';
import { ContactUsComponent } from './pages/account/contact-us/contact-us';


export const routes: Routes = [
    { path: "", redirectTo: "login", pathMatch: "full" },
    { path: "mobile-number-component", component: MobileNumberComponent },
    { path: "mobile-otp-component", component: MobileOTPComponent },
    { path: "login", component: LoginComponent },
    { path: "app-version-check", component: AppVersionCheckComponent },
    { path: "greeting", component: GreetingsComponent },
    { path: "trip-list", component: TripsListComponent },
    { path: "my-info", component: MyInfoComponent },
    { path: "hop-list", component: HopsListComponent },
    { path: "hop-details", component: HopDetailsComponent },
    { path: "trip-details", component: TripDetailsComponent },
    { path: "profile", component: ProfileComponent },
    { path: "web-view", component: WebViewComponent },
    { path: "web-view", component: WebViewComponent },
    { path: 'contact-us', component: ContactUsComponent },
]
