'use strict';
const get = require('lodash/fp/get');
const { stripIndents } = require('common-tags');

const { TextareaField } = require('../../lib/field-types');

function wordCountText(locale, maxWords) {
    const localise = get(locale);

    return localise({
        en: `<p><strong>
            You can write up to ${maxWords} words for this section,
            but don't worry if you use less.
        </strong></p>`,
        cy: `<p><strong>
            Gallwch ysgrifennu hyd at ${maxWords} gair i’r adran hon,
            ond peidiwch â poeni os byddwch yn defnyddio llai.
        </strong></p>`,
    });
}

module.exports = {
    fieldYourIdeaProject(locale) {
        const localise = get(locale);

        const minWords = 50;
        const maxWords = 300;

        function guidanceText() {
            return localise({
                en: `<p><strong>
                    Here are some ideas of what to tell us about your project:
                </strong></p>
                <ul>
                    <li>What you would like to do</li>
                    <li>What difference your project will make</li>
                    <li>Who will benefit from it</li>
                    <li>How long you expect to run it for. This can be an estimate</li>
                    <li>How you'll make sure people know about it</li>
                    <li>How you plan to learn from it and use this
                        learning to shape future projects</li>
                    <li>Is it something new, or are you continuing something that
                        has worked well previously? We want to fund both types of projects</li>
                </ul>`,

                cy: `<p><strong>
                    Dyma rhai syniadau o’r hyn i ddweud wrthym am eich prosiect:
                </strong></p>
                <ul>
                    <li>Beth y hoffech ei wneud?</li>
                    <li>Pa wahaniaeth bydd eich prosiect yn ei wneud?</li>
                    <li>Pwy fydd yn cael budd ohono?</li>
                    <li>Am ba mor hir rydych yn disgwyl ei gynnal?
                        Gall hyn fod yn amcangyfrif.</li> 
                    <li>Sut y byddwch yn sicrhau fod pobl yn gwybod amdano?</li>
                    <li>Sut rydych yn bwriadu dysgu ohono a defnyddio’r wybodaeth 
                    hwn i siapio prosiectau yn y dyfodol?</li>
                    <li>A yw’n rhywbeth newydd, neu ydych yn parhau â rhywbeth
                        sydd wedi gweithio’n dda yn flaenorol? Rydym eisiau
                        ariannu’r ddau fath o brosiectau.</li>
    
                </ul>`,
            });
        }

        return new TextareaField({
            locale: locale,
            name: 'yourIdeaProject',
            label: localise({
                en: `What would you like to do?`,
                cy: `Beth yr hoffech ei wneud?`,
            }),
            explanation: stripIndents`${guidanceText()}${wordCountText(
                locale,
                maxWords
            )}`,
            type: 'textarea',
            minWords: minWords,
            maxWords: maxWords,
            attributes: { rows: 20 },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Tell us about your project',
                        cy: 'Dywedwch wrthym am eich prosiect',
                    }),
                },
            ],
        });
    },
    fieldYourIdeaPriorities(locale, data) {
        const localise = get(locale);
        const minWords = 50;
        const maxWords = 150;

        function prioritiesDiversity() {
            if (get('projectCountry')(data) === 'england') {
                return localise({
                    en: `
                    <p>With the COVID-19 pandemic still with us, we'll continue to support people and communities most adversely impacted by COVID-19. We can support you to:</p>
                    <ul>
                        <li>continue to deliver activity - whether your community needs crisis response, recovery or business as usual activity</li>
                        <li>change and adapt, becoming more resilient to respond to new and future challenges.</li>
                    </ul>
                    <p>In order to support communities to thrive, we aim to:</p>
                    <ol>
                        <li>build strong relationships in and across communities</li>
                        <li>improve the places and spaces that matter to communities</li>
                        <li>help more people to reach their potential, by supporting them at the earliest possible stage.</li>
                    </ol>`,
                    cy: `
                    <p>Gyda’r pandemig COVID-19 yn dal I fod o gwmpas, byddwn yn parhau i gefnogi pobl a chymunedau yr effeithir arnynt fwyaf o COVID-19. Gallwn eich cefnogi i:</p>
                    <ul>
                        <li>tbarhau i gyflawni gweithgarwch, p'un a ydych yn ymateb i'r argyfwng uniongyrchol neu'n cefnogi gweithgarwch adfer</li>
                        <li>tnewid ac addasu, dod yn fwy gwydn er mwyn ymateb i heriau newydd ac yn y dyfodol.</li>
                    </ul>
                    <p>Er mwyn cefnogi cymunedau i ffynnu, rydym yn anelu i:</p>
                    <ol>
                        <li>tmeithrin cydberthnasau cryf mewn cymunedau ac ar eu traws</li>
                        <li>tgwella'r lleoedd a'r mannau sy'n bwysig i gymunedau</li>
                        <li>thelpu mwy o bobl i gyrraedd eu potensial, drwy eu cefnogi cyn gynted â phosibl.</li>
                    </ol>
                    `,
                });
            }
            else {
                return localise({
                    en: `
                    <p>A good application should do at least one of these three things:</p>
                    <ol>
                        <li>build strong relationships in and across communities</li>
                        <li>improve the places and spaces that matter to communities</li>
                        <li>help more people to reach their potential, by supporting them at the earliest possible stage.</li>
                    </ol>
                    <p>We're also keen to support people and communities most adversely impacted by COVID-19. We can support you to:</p>
                    <ul>
                        <li>continue to deliver activity, whether you are responding to the immediate crisis or supporting recovery activity</li>
                        <li>change and adapt, becoming more resilient in order to respond to new and future challenges.</li>
                    </ul>
                    `,
                    cy: `
                    <p>Dylai cais da wneud o leiaf un o'r tri pheth hyn:</p>
                    <ol>
                        <li>tmeithrin cydberthnasau cryf mewn cymunedau ac ar eu traws</li>
                        <li>tgwella'r lleoedd a'r mannau sy'n bwysig i gymunedau</li>
                        <li>thelpu mwy o bobl i gyrraedd eu potensial, drwy eu cefnogi cyn gynted â phosibl.</li>
                    </ol>
                    <p>Rydym hefyd yn awyddus i gefnogi pobl a chymunedau sydd wedi’u heffeithio fwyaf andwyol gan COVID-19. Gallwn eich cefnogi i:</p>
                    <ul>
                        <li>tbarhau i gyflawni gweithgarwch, p'un a ydych yn ymateb i'r argyfwng uniongyrchol neu'n cefnogi gweithgarwch adfer</li>
                        <li>tnewid ac addasu, dod yn fwy gwydn er mwyn ymateb i heriau newydd ac yn y dyfodol.</li>
                    </ul>`,
                });
            }
        }

        function guidanceText() {
            return localise({
                en: `${prioritiesDiversity()}`,
                cy: `${prioritiesDiversity()}`,
            });
        }

        function getLabel() {
            return localise({
                en: `How does your project meet our funding priorities?`,
                cy: `Sut mae eich prosiect yn bodloni ein blaenoriaethau ariannu?`,
            });
        }

        return new TextareaField({
            locale: locale,
            name: 'yourIdeaPriorities',
            label: getLabel(),
            explanation: stripIndents`${guidanceText()}${wordCountText(
                locale,
                maxWords
            )}`,
            minWords: minWords,
            maxWords: maxWords,
            attributes: { rows: 12 },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Tell us how your project meets at least one of our funding priorities`,
                        cy: `Dywedwch wrthym sut mae eich prosiect yn cwrdd ag o leiaf un o’n blaenoriaethau ariannu`,
                    }),
                },
            ],
        });
    },
    fieldYourIdeaCommunity(locale, data) {
        const localise = get(locale);

        const minWords = 50;
        const maxWords = 200;

        function guidanceListItems(en = true) {
            if (en) {
                if (get('projectCountry')(data) === 'england') {
                    return `<li>Having regular chats with community members, in person or on social media</li>
                    <li>Including community members on your board or committee</li>
                    <li>Regular surveys</li>
                    <li>Setting up steering groups</li>`;
                } else {
                    return `<li>Having regular chats with community members, in person or on social media</li>
                    <li>Including community members on your board or committee</li>
                    <li>Regular surveys</li>
                    <li>Setting up steering groups</li>
                    <li>Running open days</li>`;
                }
            } else {
                if (get('projectCountry')(data) === 'england') {
                    return `<li>Cael sgyrsiau rheolaidd ag aelodau’r gymuned, naill ai mewn person neu gyfryngau cymdeithasol</li>
                    <li>Cynnwys aelodau o'r gymuned ar eich bwrdd neu bwyllgor</li>
                    <li>Arolygon rheolaidd</li>
                    <li>Sefydlu grwpiau llywio</li>`;
                } else {
                    return `<li>Cael sgyrsiau rheolaidd ag aelodau’r gymuned, naill ai mewn person neu gyfryngau cymdeithasol</li>
                    <li>Cynnwys aelodau o'r gymuned ar eich bwrdd neu bwyllgor</li>
                    <li>Arolygon rheolaidd</li>
                    <li>Sefydlu grwpiau llywio</li>
                    <li>Cynnal diwrnodau agored</li>`;
                }
            }
        }

        function guidanceText() {
            return localise({
                en: `<p>
                    We believe that people understand what's needed in their
                    communities better than anyone. Tell us how your community 
                    came up with the idea for your project. We want to know how
                    many people you've spoken to, and how they'll be involved
                    in the development and delivery of the project.
                </p>
                <p><strong>Here are some examples of how you could be involving your community:</strong></p>
                <ul>
                    ${guidanceListItems()}
                </ul>`,
                cy: `<p>
                    Rydym o’r gred fod pobl yn gwybod yr hyn sydd ei angen yn eu
                    cymunedau yn well nag unrhyw un. Dywedwch wrthym sut feddyliodd
                    eich cymuned am y syniad i’ch prosiect. Rydym eisiau gwybod
                    faint o bobl rydych wedi siarad â nhw, a sut y byddant yn cael
                    eu cynnwys yn y datblygiad a’r ddarpariaeth o’r prosiect.
                </p>
                <p><strong>Dyma rai enghreifftiau o sut y gallech fod yn cynnwys eich cymuned:</strong></p>
                <ul>
                  ${guidanceListItems(false)}
                </ul>`,
            });
        }

        return new TextareaField({
            locale: locale,
            name: 'yourIdeaCommunity',
            label: localise({
                en: `How does your project involve your community?`,
                cy: `Sut mae eich prosiect yn cynnwys eich cymuned?`,
            }),
            labelDetails: {
                summary: localise({
                    en: `What do we mean by community?`,
                    cy: `Beth rydym yn ei olygu drwy gymuned?`,
                }),
                content: localise({
                    en: `<ol>
                    <li>People living in the same area</li>
                    <li>People who have similar interests or life experiences,
                        but might not live in the same area</li>
                    <li>Even though schools can be at the heart of a
                        community—we'll only fund schools that also
                        benefit the communities around them.</li>
                </ol>`,
                    cy: `<ol>
                    <li>Pobl yn byw yn yr un ardal</li>
                    <li>Pobl sydd â diddordebau neu brofiadau bywyd tebyg,
                        ond efallai ddim yn byw yn yr un ardal</li>
                    <li>Er gall ysgolion fod wrth wraidd cymuned—byddwn dim ond yn
                        ariannu ysgolion sydd hefyd yn rhoi budd i gymunedau o’u cwmpas.
                    </li>
                </ol>`,
                }),
            },
            explanation: stripIndents`${guidanceText()}${wordCountText(
                locale,
                maxWords
            )}`,
            minWords: minWords,
            maxWords: maxWords,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Tell us how your project involves your community`,
                        cy: `Dywedwch wrthym sut mae eich prosiect yn cynnwys eich cymuned`,
                    }),
                },
            ],
        });
    },
};
