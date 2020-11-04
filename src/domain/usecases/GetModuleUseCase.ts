import { UseCase } from "../../webapp/CompositionRoot";
import { TrainingModule } from "../entities/TrainingModule";

export class GetModuleUseCase implements UseCase {
    public async execute(): Promise<TrainingModule> {
        return {
            id: "",
            key: "data-entry",
            dhisAppKey: "data-entry",
            name: "Data entry",
            publicAccess: "--------",
            userAccesses: [],
            userGroupAccesses: [],
            user: {
                id: "",
                name: "",
            },
            lastUpdatedBy: {
                id: "",
                name: "",
            },
            created: new Date(),
            lastUpdated: new Date(),
            type: "core",
            versionRange: "",
            dhisVersionRange: "",
            dhisLaunchUrl: "/dhis-web-dataentry/index.action",
            details: {
                title: "Welcome to the tutorial on Data entry",
                description:
                    "The data entry application is used to manually enter routine data that have been recorded for one location on a regular basis, such as weekly, monthly etc. Data is registered for a location, time period and a specific data set.",
                icon:
                    "https://user-images.githubusercontent.com/2181866/93660832-454b1700-fa53-11ea-881c-5fe97edb02a3.png",
            },
            steps: [
                {
                    path: "",
                    title: "Select your location",
                    contents: [
                        {
                            type: "markdown",
                            text:
                                "![Find your location](https://user-images.githubusercontent.com/2181866/98086587-46a79600-1e7f-11eb-960b-8a463abbb3b7.gif)\n\nFind the name of the location that you would like to enter data for on the drop-down tree menu. You can click down to lower geographic levels on the menu by clicking on the + symbol next to the location names.\n\n<i>Note: Not all datasets/forms may be available for every location.</i>",
                        },
                        {
                            type: "markdown",
                            text:
                                "![Click on your organisation unit](https://user-images.githubusercontent.com/2181866/98086565-43140f00-1e7f-11eb-9d05-22f5b4f7441e.gif)\n\nClick on your location on the menu to highlight it orange. This will enter the location in the “Organisation Unit” field of your data entry form.\n\nIf you do not see the name of your location on the menu, you can select a location from higher geographical levels in the menu (for example, select your province if your district is not shown).",
                        },
                        {
                            type: "markdown",
                            text:
                                "![Use the search box](https://user-images.githubusercontent.com/2181866/98086567-43aca580-1e7f-11eb-9b01-67099113dd87.gif)\n\nAnother quick way to find a location is to use the search box next to the green symbol with the lens above the tree menu. Type in the name or first few letters of your location, and select it from the drop-down menu by clicking on it to highlight it orange. This will enter the location in the Organisation Unit field of your data entry form.",
                        },
                    ],
                },
                {
                    path: "",
                    title: "Select your data set",
                    contents: [
                        {
                            type: "markdown",
                            text:
                                "![Select your data set](https://user-images.githubusercontent.com/2181866/98086570-43aca580-1e7f-11eb-971a-5225e6902803.gif)\n\nSelect a data set from the dropdown list of data sets available to your selected location. The data set you select will create a form with similar fields to your paper based form.\n\n<i>Note: (Select data set) is not an option you can select from the drop-down menu</i>\n\n<i>Note: Not all data sets are available for all locations.</i>",
                        },
                    ],
                },
                {
                    path: "",
                    title: "Select time period",
                    contents: [
                        {
                            type: "markdown",
                            text:
                                "![Select a period to register data](https://user-images.githubusercontent.com/2181866/98086571-44453c00-1e7f-11eb-89cb-448bf8313a4c.gif)\n\nSelect a period for which to register data. The available periods are determined by the reporting frequency required for the selected form.\n\n<i>Note: (Select period) is not an option you can select from the drop-down menu</i>\n\n<i>Note: If data has already been submitted for the period that you have selected, the data will appear automatically in the form.</i>",
                        },
                        {
                            type: "markdown",
                            text:
                                "![You can also toggle between years](https://user-images.githubusercontent.com/2181866/98086574-44453c00-1e7f-11eb-8ae9-96090b132cec.gif)\n\nYou can also toggle between years, moving a year forward or backward using the “Prev year” and “Next year” buttons next to the period entry field.",
                        },
                    ],
                },
                {
                    path: "",
                    title: "Select other data",
                    contents: [
                        {
                            type: "markdown",
                            text:
                                "![Select other data](https://user-images.githubusercontent.com/2181866/98086576-44ddd280-1e7f-11eb-85f7-12cc613ac1aa.gif)\n\nBy now you should see the data entry form. If not, there may be additional data categories that you need to select from drop-down menus depending on how your form is structured. This may include the type of reporting institution, project or other features.",
                        },
                    ],
                },
                {
                    path: "",
                    title: "Enter data in the form",
                    contents: [
                        {
                            type: "markdown",
                            text:
                                "![Enter data in the form](https://user-images.githubusercontent.com/2181866/98086577-44ddd280-1e7f-11eb-8bb4-7f37dda5e6a2.gif)\n\nStart entering data by clicking inside the first cell and selecting data from the dropdown menus, typing values in manually or clicking on check boxes.\n\n<i>Note: Your browser may sometimes suggest values that are not built into the DHIS2 forms but have been stored in your browser cache from other websites. You can remove these values using the “Browser Cache Cleaner” on the applications menu.</i>\n\nThe cells will turn yellow when you are adding in your data and will turn green when the data has been approved and saved to the system. Grey fields are those that are completed automatically by the DHIS2 system.\n\n![Enter data in the form](https://user-images.githubusercontent.com/2181866/98086580-45766900-1e7f-11eb-9959-a5823c5c9a02.gif)\n\nRed cells indicate that there is a problem with the data you have entered – it is either an invalid value or outside an acceptable range. You will get a pop-up window explaining the problem. Click on the cell and correct the data. The cell will turn green once you have entered the correct value.",
                        },
                    ],
                },
                {
                    path: "",
                    title: "Run a validation check",
                    contents: [
                        {
                            type: "markdown",
                            text:
                                "![Run a validation check](https://user-images.githubusercontent.com/2181866/98086581-45766900-1e7f-11eb-9ed0-0340c951f6c9.gif)\n\nWhen you have completed entering data in the form, it is important to run a validation check to make sure your data is logical and valid, based on rules built into each form. This step ensures that the data you have entered is accurate. Click “Run validation” to check your data. If all your data is accurate, you will receive a message telling you that the data has passed the validation test once it is complete.\n\n![Run a validation check](https://user-images.githubusercontent.com/2181866/98086582-45766900-1e7f-11eb-85cb-de5f2a572b0a.gif)\n\nIf some of the values in your form are inaccurate, you will get a different message telling you that there are errors in your data. It will also tell you which values are invalid and tells you what rule the data needs to meet (for example, the correct range) in order for your data to be valid.",
                        },
                    ],
                },
                {
                    path: "",
                    title: "Correct your data",
                    contents: [
                        {
                            type: "markdown",
                            text:
                                "![Correct your data](https://user-images.githubusercontent.com/2181866/98086583-460eff80-1e7f-11eb-9d27-a43b3fea1e6a.gif)\n\nYou should correct your data if the validation test detected errors on your form. Click on the cells that have invalid data (shown on the validation test message), remove the incorrect value and retype or reselect the correct value. The new value should meet the requirements of the validation rule shown on the validation test message.",
                        },
                    ],
                },
                {
                    path: "",
                    title: "Save and submit your form",
                    contents: [
                        {
                            type: "markdown",
                            text:
                                "![Save and submit your form](https://user-images.githubusercontent.com/2181866/98086585-460eff80-1e7f-11eb-9333-101cb9ba8c33.gif)\n\nWhen you have finished entering and correcting the data on your form, click “complete” to submit the data to DHIS2.\n\nIt is important to remember to submit your data every time you fill out a new form. If you forget to click “complete”, your data will not be captured by DHIS2 and will not be included in data reports. This will impact the quality of the data on DHIS2.\n\nBe careful about clicking “complete” because once you have submitted your data, you will not be able to edit it unless you have editing rights.",
                        },
                    ],
                },
            ],
        };
    }
}
