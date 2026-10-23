import { PageHeader } from '@kit/ui/page';

function UserSettingsLayout(props: React.PropsWithChildren) {
  return (
    <>
      <PageHeader
        title={'Settings'}
        description={'Your profile, sign-in details and security.'}
      />

      {props.children}
    </>
  );
}

export default UserSettingsLayout;
