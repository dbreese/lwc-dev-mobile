/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
export class AndroidMockData {
    public static mockRawPacakgesString = `Warning: File test string.........       
    Installed packages:=====================] 100% Computing updates...             
      Path                                                | Version      | Description                                     | Location                                            
      -------                                             | -------      | -------                                         | -------                                             
      build-tools;28.0.3                                  | 28.0.3       | Android SDK Build-Tools 28.0.3                  | build-tools/28.0.3/                                 
      build-tools;29.0.2                                  | 29.0.2       | Android SDK Build-Tools 29.0.2                  | build-tools/29.0.2/                                 
      build-tools;30.0.2                                  | 30.0.2       | Android SDK Build-Tools 30.0.2                  | build-tools/30.0.2/                                 
      platforms;android-25                                | 3            | Android SDK Platform 25                         | platforms/android-25/                               
      platforms;android-26                                | 2            | Android SDK Platform 26                         | platforms/android-26/                               
      platforms;android-27                                | 3            | Android SDK Platform 27                         | platforms/android-27/                               
      platforms;android-28                                | 6            | Android SDK Platform 28                         | platforms/android-28/                               
      platforms;android-29                                | 3            | Android SDK Platform 29                         | platforms/android-29/                               
      platforms;android-30                                | 3            | Android SDK Platform 30                         | platforms/android-30/                               
      system-images;android-28;default;x86_64             | 4            | Intel x86 Atom_64 System Image                  | system-images/android-28/default/x86_64/            
      system-images;android-28;google_apis;x86            | 10           | Google APIs Intel x86 Atom System Image         | system-images/android-28/google_apis/x86/           
      system-images;android-28;google_apis_playstore;x86  | 9            | Google Play Intel x86 Atom System Image         | system-images/android-28/google_apis_playstore/x86/ 
      system-images;android-29;default;x86_64             | 7            | Intel x86 Atom_64 System Image                  | system-images/android-29/default/x86_64/            
      system-images;android-29;google_apis;x86            | 8            | Google APIs Intel x86 Atom System Image         | system-images/android-29/google_apis/x86/           
      system-images;android-30;google_apis;x86            | 9            | Google APIs Intel x86 Atom System Image         | system-images/android-30/google_apis/x86/           
      system-images;android-30;google_apis;x86_64         | 9            | Google APIs Intel x86 Atom_64 System Image      | system-images/android-30/google_apis/x86_64/        
      tools                                               | 26.1.1       | Android SDK Tools 26.1.1                        | tools/                                              
    Available Packages:
      Path                                                                                     | Version      | Description                                                         
    `;

    public static badMockRawPacakagesString =
        'Installed packages:=====================]';

    public static mockRawStringPackageLength = 13;
}
