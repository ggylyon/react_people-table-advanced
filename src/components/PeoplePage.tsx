import { PeopleFilters } from './PeopleFilters';
import { Loader } from './Loader';
import { PeopleTable } from './PeopleTable';
import { useEffect, useState } from 'react';
import { getPeople } from '../api';
import { useDispatch, useGlobalState } from '../store/GlobalProvider';
import { useSearchParams } from 'react-router-dom';

export const PeoplePage = () => {
  const { people, updatedPeople } = useGlobalState();
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    setIsLoading(true);

    getPeople()
      .then(response => {
        dispatch({ type: 'loadPeople', payload: { people: response } });
      })
      .catch(() => {
        setIsError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [dispatch]);

  useEffect(() => {
    let filteredPeople = [...people];

    const query = searchParams.get('query');
    const centuries = searchParams.getAll('centuries');
    const sex = searchParams.get('sex');

    if (query) {
      filteredPeople = filteredPeople.filter(person => {
        return (
          person.name.includes(query) ||
          person.fatherName?.includes(query) ||
          person.motherName?.includes(query)
        );
      });
    }

    if (centuries.length > 0) {
      filteredPeople = filteredPeople.filter(person => {
        return centuries.includes(String(Math.ceil(person.born / 100)));
      });
    }

    if (sex) {
      filteredPeople = filteredPeople.filter(person => {
        return person.sex === sex;
      });
    }

    const sortCriteria = searchParams.get('sort');

    if (sortCriteria) {
      const order = searchParams.get('order');

      switch (sortCriteria) {
        case 'name':
        case 'sex':
          filteredPeople.sort((firstPerson, secondPerson) =>
            firstPerson[sortCriteria].localeCompare(secondPerson[sortCriteria]),
          );
          break;
        case 'born':
        case 'died':
          filteredPeople.sort(
            (firstPerson, secondPerson) =>
              firstPerson[sortCriteria] - secondPerson[sortCriteria],
          );
      }

      if (order) {
        filteredPeople.reverse();
      }
    }

    dispatch({
      type: 'updatePeople',
      payload: { updatedPeople: filteredPeople },
    });
  }, [searchParams, people, dispatch]);

  return (
    <>
      <h1 className="title">People Page</h1>

      <div className="block">
        <div className="columns is-desktop is-flex-direction-row-reverse">
          <div className="column is-7-tablet is-narrow-desktop">
            {!isLoading && !isError && <PeopleFilters />}
          </div>

          <div className="column">
            <div className="box table-container">
              {isLoading && <Loader />}
              {isError && (
                <p data-cy="peopleLoadingError">Something went wrong</p>
              )}

              {!isLoading && people.length === 0 && !isError && (
                <p data-cy="noPeopleMessage">
                  There are no people on the server
                </p>
              )}

              {!isError && !isLoading && updatedPeople.length === 0 && (
                <p>There are no people matching the current search criteria</p>
              )}

              {!isError && !isLoading && people.length > 0 && <PeopleTable />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
